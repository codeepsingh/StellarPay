#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, token, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum EscrowStatus {
    Pending = 0,
    Funded = 1,
    Released = 2,
    Refunded = 3,
    Disputed = 4,
    Cancelled = 5,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Profile {
    pub wallet: Address,
    pub reputation_score: u32,
    pub completed_contracts: u32,
    pub failed_contracts: u32,
    pub total_volume: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: u64,
    pub creator: Address,
    pub recipient: Address,
    pub amount: i128,
    pub token: Address,
    pub status: u32,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Profile(Address),
    Escrow(u64),
    Admin,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    NotFound = 4,
    InvalidInput = 5,
    InvalidState = 6,
}

#[contract]
pub struct StellarPayContract;

#[contractimpl]
impl StellarPayContract {
    // Initialize the contract with an admin/moderator address
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        
        // Emit admin assignment event
        env.events().publish(
            (Symbol::new(&env, "admin_assigned"),),
            admin,
        );
        
        Ok(())
    }

    // Explicitly create a user profile (can be called by any user to register)
    pub fn create_profile(env: Env, user: Address) -> Result<(), Error> {
        user.require_auth();
        let key = DataKey::Profile(user.clone());
        if env.storage().persistent().has(&key) {
            return Ok(()); // Already exists
        }

        let profile = Profile {
            wallet: user.clone(),
            reputation_score: 100, // starting base score
            completed_contracts: 0,
            failed_contracts: 0,
            total_volume: 0,
        };

        env.storage().persistent().set(&key, &profile);

        env.events().publish(
            (Symbol::new(&env, "profile_created"), user),
            100_u32,
        );

        Ok(())
    }

    // Create and fund a new escrow agreement
    pub fn create_escrow(
        env: Env,
        creator: Address,
        recipient: Address,
        amount: i128,
        token_address: Address,
        escrow_id: u64,
    ) -> Result<(), Error> {
        creator.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidInput);
        }

        let escrow_key = DataKey::Escrow(escrow_id);
        if env.storage().persistent().has(&escrow_key) {
            return Err(Error::InvalidState); // Escrow already exists
        }

        // Lazy initialize creator profile if it doesn't exist
        let creator_profile_key = DataKey::Profile(creator.clone());
        if !env.storage().persistent().has(&creator_profile_key) {
            let profile = Profile {
                wallet: creator.clone(),
                reputation_score: 100,
                completed_contracts: 0,
                failed_contracts: 0,
                total_volume: 0,
            };
            env.storage().persistent().set(&creator_profile_key, &profile);
        }

        // Lock funds into this contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&creator, &env.current_contract_address(), &amount);

        let escrow = Escrow {
            id: escrow_id,
            creator: creator.clone(),
            recipient: recipient.clone(),
            amount,
            token: token_address,
            status: EscrowStatus::Funded as u32,
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&escrow_key, &escrow);

        env.events().publish(
            (Symbol::new(&env, "escrow_created"), escrow_id),
            (creator, recipient, amount),
        );

        Ok(())
    }

    // Release escrowed funds to the recipient (authorized by creator)
    pub fn release_funds(env: Env, escrow_id: u64) -> Result<(), Error> {
        let escrow_key = DataKey::Escrow(escrow_id);
        if !env.storage().persistent().has(&escrow_key) {
            return Err(Error::NotFound);
        }

        let mut escrow: Escrow = env.storage().persistent().get(&escrow_key).unwrap();
        if escrow.status != EscrowStatus::Funded as u32 && escrow.status != EscrowStatus::Disputed as u32 {
            return Err(Error::InvalidState);
        }

        // Must be authorized by the creator
        escrow.creator.require_auth();

        // Update status to Released
        escrow.status = EscrowStatus::Released as u32;
        env.storage().persistent().set(&escrow_key, &escrow);

        // Transfer funds to recipient
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.recipient, &escrow.amount);

        // Update reputation profiles for both parties
        Self::modify_reputation(&env, &escrow.creator, true, escrow.amount);
        Self::modify_reputation(&env, &escrow.recipient, true, escrow.amount);

        env.events().publish(
            (Symbol::new(&env, "escrow_released"), escrow_id),
            escrow.recipient.clone(),
        );

        Ok(())
    }

    // Refund escrowed funds back to the creator (authorized by recipient)
    pub fn refund_funds(env: Env, escrow_id: u64) -> Result<(), Error> {
        let escrow_key = DataKey::Escrow(escrow_id);
        if !env.storage().persistent().has(&escrow_key) {
            return Err(Error::NotFound);
        }

        let mut escrow: Escrow = env.storage().persistent().get(&escrow_key).unwrap();
        if escrow.status != EscrowStatus::Funded as u32 && escrow.status != EscrowStatus::Disputed as u32 {
            return Err(Error::InvalidState);
        }

        // Must be authorized by the recipient
        escrow.recipient.require_auth();

        // Update status to Refunded
        escrow.status = EscrowStatus::Refunded as u32;
        env.storage().persistent().set(&escrow_key, &escrow);

        // Transfer funds back to creator
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.creator, &escrow.amount);

        // Deduct reputation for recipient since they refunded/failed the contract
        Self::modify_reputation(&env, &escrow.recipient, false, 0);

        env.events().publish(
            (Symbol::new(&env, "escrow_refunded"), escrow_id),
            escrow.creator.clone(),
        );

        Ok(())
    }

    // Cancel escrow (authorized by creator, returning locked funds)
    pub fn cancel_escrow(env: Env, escrow_id: u64) -> Result<(), Error> {
        let escrow_key = DataKey::Escrow(escrow_id);
        if !env.storage().persistent().has(&escrow_key) {
            return Err(Error::NotFound);
        }

        let mut escrow: Escrow = env.storage().persistent().get(&escrow_key).unwrap();
        if escrow.status != EscrowStatus::Funded as u32 {
            return Err(Error::InvalidState);
        }

        // Must be authorized by the creator
        escrow.creator.require_auth();

        // Cancel and refund back to creator
        escrow.status = EscrowStatus::Cancelled as u32;
        env.storage().persistent().set(&escrow_key, &escrow);

        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.creator, &escrow.amount);

        env.events().publish(
            (Symbol::new(&env, "escrow_cancelled"), escrow_id),
            escrow.creator.clone(),
        );

        Ok(())
    }

    // Raise/open a dispute (authorized by either creator or recipient)
    pub fn open_dispute(env: Env, escrow_id: u64, caller: Address, reason: Symbol) -> Result<(), Error> {
        let escrow_key = DataKey::Escrow(escrow_id);
        if !env.storage().persistent().has(&escrow_key) {
            return Err(Error::NotFound);
        }

        let mut escrow: Escrow = env.storage().persistent().get(&escrow_key).unwrap();
        if escrow.status != EscrowStatus::Funded as u32 {
            return Err(Error::InvalidState);
        }

        // Caller must authorize the dispute
        caller.require_auth();

        if caller != escrow.creator && caller != escrow.recipient {
            return Err(Error::Unauthorized);
        }

        escrow.status = EscrowStatus::Disputed as u32;
        env.storage().persistent().set(&escrow_key, &escrow);

        env.events().publish(
            (Symbol::new(&env, "escrow_disputed"), escrow_id),
            (caller, reason),
        );

        Ok(())
    }

    // Resolve a dispute in favor of either creator or recipient (authorized by either mutual concession or Admin)
    pub fn resolve_dispute(env: Env, escrow_id: u64, winner: Address, decider: Address) -> Result<(), Error> {
        let escrow_key = DataKey::Escrow(escrow_id);
        if !env.storage().persistent().has(&escrow_key) {
            return Err(Error::NotFound);
        }

        let mut escrow: Escrow = env.storage().persistent().get(&escrow_key).unwrap();
        if escrow.status != EscrowStatus::Disputed as u32 {
            return Err(Error::InvalidState);
        }

        if winner != escrow.creator && winner != escrow.recipient {
            return Err(Error::InvalidInput);
        }

        // Decider must authorize the resolution
        decider.require_auth();

        // Check if decider is the admin
        let is_admin = if env.storage().instance().has(&DataKey::Admin) {
            let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
            decider == admin
        } else {
            false
        };

        if !is_admin {
            // Non-admin can only concede to the counterparty
            if decider == escrow.creator {
                // Creator concedes, winner must be recipient
                if winner != escrow.recipient {
                    return Err(Error::Unauthorized);
                }
            } else if decider == escrow.recipient {
                // Recipient concedes, winner must be creator
                if winner != escrow.creator {
                    return Err(Error::Unauthorized);
                }
            } else {
                return Err(Error::Unauthorized);
            }
        }

        // Close the escrow
        let is_recipient_winner = winner == escrow.recipient;
        escrow.status = if is_recipient_winner {
            EscrowStatus::Released as u32
        } else {
            EscrowStatus::Refunded as u32
        };
        env.storage().persistent().set(&escrow_key, &escrow);

        // Transfer funds to the winner
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &winner, &escrow.amount);

        // Update reputation metrics
        if is_recipient_winner {
            Self::modify_reputation(&env, &escrow.creator, true, escrow.amount);
            Self::modify_reputation(&env, &escrow.recipient, true, escrow.amount);
        } else {
            Self::modify_reputation(&env, &escrow.recipient, false, 0);
        }

        env.events().publish(
            (Symbol::new(&env, "dispute_resolved"), escrow_id),
            winner,
        );

        Ok(())
    }

    // Get specific profile
    pub fn get_profile(env: Env, user: Address) -> Option<Profile> {
        let key = DataKey::Profile(user);
        env.storage().persistent().get(&key)
    }

    // Get specific escrow details
    pub fn get_escrow(env: Env, escrow_id: u64) -> Option<Escrow> {
        let key = DataKey::Escrow(escrow_id);
        env.storage().persistent().get(&key)
    }

    // Internal helper to update user profiles
    fn modify_reputation(env: &Env, user: &Address, is_completed: bool, volume: i128) {
        let key = DataKey::Profile(user.clone());
        let mut profile = if env.storage().persistent().has(&key) {
            env.storage().persistent().get(&key).unwrap()
        } else {
            Profile {
                wallet: user.clone(),
                reputation_score: 100,
                completed_contracts: 0,
                failed_contracts: 0,
                total_volume: 0,
            }
        };

        if is_completed {
            profile.completed_contracts = profile.completed_contracts.saturating_add(1);
            profile.reputation_score = profile.reputation_score.saturating_add(5).min(1000);
            profile.total_volume = profile.total_volume.saturating_add(volume);
        } else {
            profile.failed_contracts = profile.failed_contracts.saturating_add(1);
            profile.reputation_score = profile.reputation_score.saturating_sub(15).max(0);
        }

        env.storage().persistent().set(&key, &profile);
    }
}

mod test;
