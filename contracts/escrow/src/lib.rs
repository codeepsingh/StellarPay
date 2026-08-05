#![no_std]
use soroban_sdk::{contract, contractimpl, contractclient, contracttype, token, Address, Env, Symbol};

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
    Escrow(u64),
}

#[contractclient(name = "ReputationClient")]
pub trait ReputationInterface {
    fn update_reputation(env: Env, user: Address, is_completed: bool, volume: i128, authority: Address);
    fn create_profile(env: Env, user: Address);
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    // Create and fund an escrow
    pub fn create_escrow(
        env: Env,
        creator: Address,
        recipient: Address,
        amount: i128,
        token_address: Address,
        escrow_id: u64,
    ) {
        // Enforce that creator authorizes the escrow creation
        creator.require_auth();

        let key = DataKey::Escrow(escrow_id);
        if env.storage().persistent().has(&key) {
            panic!("Escrow already exists");
        }

        // Lock funds into this contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&creator, &env.current_contract_address(), &amount);

        let escrow = Escrow {
            id: escrow_id,
            creator: creator.clone(),
            recipient: recipient.clone(),
            amount,
            token: token_address.clone(),
            status: EscrowStatus::Funded as u32,
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&key, &escrow);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "escrow_created"), escrow_id),
            (creator, recipient, amount),
        );
    }

    // Release funds to the recipient (can be called by the creator)
    pub fn release_funds(env: Env, escrow_id: u64, reputation_contract: Address) {
        let key = DataKey::Escrow(escrow_id);
        if !env.storage().persistent().has(&key) {
            panic!("Escrow does not exist");
        }

        let mut escrow: Escrow = env.storage().persistent().get(&key).unwrap();
        if escrow.status != EscrowStatus::Funded as u32 && escrow.status != EscrowStatus::Disputed as u32 {
            panic!("Escrow is not in a releasable state");
        }

        // Only the creator can release the funds (or we can support release via dispute resolution)
        escrow.creator.require_auth();

        // Update status
        escrow.status = EscrowStatus::Released as u32;
        env.storage().persistent().set(&key, &escrow);

        // Transfer funds to the recipient
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.recipient, &escrow.amount);

        // Call reputation contract
        let reputation_client = ReputationClient::new(&env, &reputation_contract);
        
        // Update reputation for creator (completed, adds score, adds volume)
        reputation_client.update_reputation(&escrow.creator, &true, &escrow.amount, &env.current_contract_address());
        // Update reputation for recipient (completed, adds score, adds volume)
        reputation_client.update_reputation(&escrow.recipient, &true, &escrow.amount, &env.current_contract_address());

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "escrow_released"), escrow_id),
            escrow.recipient.clone(),
        );
    }

    // Refund funds back to the creator (can be called by the recipient)
    pub fn refund_funds(env: Env, escrow_id: u64, reputation_contract: Address) {
        let key = DataKey::Escrow(escrow_id);
        if !env.storage().persistent().has(&key) {
            panic!("Escrow does not exist");
        }

        let mut escrow: Escrow = env.storage().persistent().get(&key).unwrap();
        if escrow.status != EscrowStatus::Funded as u32 && escrow.status != EscrowStatus::Disputed as u32 {
            panic!("Escrow is not in a refundable state");
        }

        // Only the recipient can authorize a refund (recipient says "I give back the money")
        escrow.recipient.require_auth();

        // Update status
        escrow.status = EscrowStatus::Refunded as u32;
        env.storage().persistent().set(&key, &escrow);

        // Transfer funds back to creator
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.creator, &escrow.amount);

        // Call reputation contract
        let reputation_client = ReputationClient::new(&env, &reputation_contract);
        reputation_client.update_reputation(&escrow.recipient, &false, &0, &env.current_contract_address());

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "escrow_refunded"), escrow_id),
            escrow.creator.clone(),
        );
    }

    // Cancel escrow (can only be called by the creator before it's funded, or if funded but recipient agrees/cancels)
    pub fn cancel_escrow(env: Env, escrow_id: u64) {
        let key = DataKey::Escrow(escrow_id);
        if !env.storage().persistent().has(&key) {
            panic!("Escrow does not exist");
        }

        let mut escrow: Escrow = env.storage().persistent().get(&key).unwrap();
        if escrow.status != EscrowStatus::Funded as u32 {
            panic!("Escrow is not funded");
        }

        // To cancel, creator requires auth
        escrow.creator.require_auth();
        
        // For cancellation, we return funds to the creator and set status to Cancelled
        escrow.status = EscrowStatus::Cancelled as u32;
        env.storage().persistent().set(&key, &escrow);

        // Transfer funds back to creator
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.creator, &escrow.amount);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "escrow_cancelled"), escrow_id),
            escrow.creator.clone(),
        );
    }

    // Open a dispute (can be called by either creator or recipient)
    pub fn open_dispute(env: Env, escrow_id: u64) {
        let key = DataKey::Escrow(escrow_id);
        if !env.storage().persistent().has(&key) {
            panic!("Escrow does not exist");
        }

        let mut escrow: Escrow = env.storage().persistent().get(&key).unwrap();
        if escrow.status != EscrowStatus::Funded as u32 {
            panic!("Escrow is not in Funded state");
        }

        // Either creator or recipient can open a dispute.
        // We check which address authorized the call
        if env.storage().instance().has(&escrow.creator) {
            escrow.creator.require_auth();
        } else {
            escrow.recipient.require_auth();
        }

        escrow.status = EscrowStatus::Disputed as u32;
        env.storage().persistent().set(&key, &escrow);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "escrow_disputed"), escrow_id),
            escrow.creator.clone(),
        );
    }

    // Resolve a dispute (winner is either creator or recipient)
    pub fn resolve_dispute(env: Env, escrow_id: u64, winner: Address, reputation_contract: Address) {
        let key = DataKey::Escrow(escrow_id);
        if !env.storage().persistent().has(&key) {
            panic!("Escrow does not exist");
        }

        let mut escrow: Escrow = env.storage().persistent().get(&key).unwrap();
        if escrow.status != EscrowStatus::Disputed as u32 {
            panic!("Escrow is not disputed");
        }

        // Verify winner is either creator or recipient
        if winner != escrow.creator && winner != escrow.recipient {
            panic!("Winner must be creator or recipient");
        }

        // Resolve by concessions:
        // If winner is recipient, creator must authorize (creator concessions)
        // If winner is creator, recipient must authorize (recipient concessions)
        if winner == escrow.recipient {
            escrow.creator.require_auth();
        } else {
            escrow.recipient.require_auth();
        }

        // Update status
        escrow.status = if winner == escrow.recipient {
            EscrowStatus::Released as u32
        } else {
            EscrowStatus::Refunded as u32
        };
        env.storage().persistent().set(&key, &escrow);

        // Transfer funds to the winner
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &winner, &escrow.amount);

        // Call reputation contract
        let reputation_client = ReputationClient::new(&env, &reputation_contract);
        if winner == escrow.recipient {
            reputation_client.update_reputation(&escrow.creator, &true, &escrow.amount, &env.current_contract_address());
            reputation_client.update_reputation(&escrow.recipient, &true, &escrow.amount, &env.current_contract_address());
        } else {
            reputation_client.update_reputation(&escrow.recipient, &false, &0, &env.current_contract_address());
        }

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "dispute_resolved"), escrow_id),
            winner,
        );
    }

    // Read escrow
    pub fn get_escrow(env: Env, escrow_id: u64) -> Option<Escrow> {
        let key = DataKey::Escrow(escrow_id);
        env.storage().persistent().get(&key)
    }
}

#[cfg(test)]
mod test;

