#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

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
pub enum DataKey {
    Profile(Address),
    Admin,
    EscrowContract,
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    // Initialize the contract with an admin and the authorized escrow contract
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    // Set the authorized escrow contract
    pub fn set_escrow_contract(env: Env, escrow: Address) {
        if !env.storage().instance().has(&DataKey::Admin) {
            panic!("Not initialized");
        }
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::EscrowContract, &escrow);
    }

    // Create a new profile for a user
    pub fn create_profile(env: Env, user: Address) {
        let key = DataKey::Profile(user.clone());
        if env.storage().persistent().has(&key) {
            return; // Profile already exists
        }
        
        let profile = Profile {
            wallet: user.clone(),
            reputation_score: 100, // base score
            completed_contracts: 0,
            failed_contracts: 0,
            total_volume: 0,
        };
        env.storage().persistent().set(&key, &profile);
    }

    // Update reputation score and volumes
    // Called by the Escrow contract (authority must be the registered escrow contract)
    pub fn update_reputation(env: Env, user: Address, is_completed: bool, volume: i128, authority: Address) {
        // Require authorization of the authority calling this function
        authority.require_auth();

        // If EscrowContract is configured, authority must match it
        if env.storage().instance().has(&DataKey::EscrowContract) {
            let registered_escrow: Address = env.storage().instance().get(&DataKey::EscrowContract).unwrap();
            if authority != registered_escrow {
                panic!("Unauthorized caller: authority does not match registered escrow contract");
            }
        }

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

    // Read methods
    pub fn get_profile(env: Env, user: Address) -> Option<Profile> {
        let key = DataKey::Profile(user);
        env.storage().persistent().get(&key)
    }

    pub fn get_score(env: Env, user: Address) -> u32 {
        let key = DataKey::Profile(user);
        if env.storage().persistent().has(&key) {
            let profile: Profile = env.storage().persistent().get(&key).unwrap();
            profile.reputation_score
        } else {
            100 // default score
        }
    }
}
