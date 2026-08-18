#![cfg(test)]
use crate::{StellarPayContract, StellarPayContractClient, EscrowStatus, Error};
use soroban_sdk::{Env, Address, token, Symbol};
use soroban_sdk::testutils::Address as _;

#[test]
fn test_initialize_and_profile() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    let contract_id = env.register(StellarPayContract, ());
    let client = StellarPayContractClient::new(&env, &contract_id);

    // Initial state
    assert!(client.get_profile(&user).is_none());

    // Initialize admin
    client.initialize(&admin);

    // Re-initialization should fail
    assert!(client.try_initialize(&admin).is_err());

    // Create profile
    client.create_profile(&user);

    // Get and verify profile
    let profile = client.get_profile(&user).unwrap();
    assert_eq!(profile.wallet, user);
    assert_eq!(profile.reputation_score, 100);
    assert_eq!(profile.completed_contracts, 0);
    assert_eq!(profile.failed_contracts, 0);
    assert_eq!(profile.total_volume, 0);
}

#[test]
fn test_create_and_release_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let recipient = Address::generate(&env);

    // Deploy token contract
    let token_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin = token::StellarAssetClient::new(&env, &token_address);

    // Mint token for creator
    token_admin.mint(&creator, &1000);

    let contract_id = env.register(StellarPayContract, ());
    let client = StellarPayContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    // Create escrow
    client.create_escrow(&creator, &recipient, &500, &token_address, &1);

    // Verify token balance
    assert_eq!(token_client.balance(&creator), 500);
    assert_eq!(token_client.balance(&contract_id), 500);

    // Check escrow state
    let escrow = client.get_escrow(&1).unwrap();
    assert_eq!(escrow.id, 1);
    assert_eq!(escrow.creator, creator);
    assert_eq!(escrow.recipient, recipient);
    assert_eq!(escrow.amount, 500);
    assert_eq!(escrow.token, token_address);
    assert_eq!(escrow.status, EscrowStatus::Funded as u32);

    // Release funds
    client.release_funds(&1);

    // Verify balances
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&recipient), 500);

    // Check updated escrow state
    let escrow_updated = client.get_escrow(&1).unwrap();
    assert_eq!(escrow_updated.status, EscrowStatus::Released as u32);

    // Check profile reputation updates
    let creator_profile = client.get_profile(&creator).unwrap();
    let recipient_profile = client.get_profile(&recipient).unwrap();

    assert_eq!(creator_profile.reputation_score, 105); // 100 + 5
    assert_eq!(creator_profile.completed_contracts, 1);
    assert_eq!(creator_profile.total_volume, 500);

    assert_eq!(recipient_profile.reputation_score, 105); // 100 + 5
    assert_eq!(recipient_profile.completed_contracts, 1);
    assert_eq!(recipient_profile.total_volume, 500);
}

#[test]
fn test_refund_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin = token::StellarAssetClient::new(&env, &token_address);
    token_admin.mint(&creator, &1000);

    let contract_id = env.register(StellarPayContract, ());
    let client = StellarPayContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    // Create escrow
    client.create_escrow(&creator, &recipient, &400, &token_address, &1);

    // Refund escrow (authorized by recipient)
    client.refund_funds(&1);

    // Verify balances
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&creator), 1000);

    // Verify recipient profile got penalized
    let recipient_profile = client.get_profile(&recipient).unwrap();
    assert_eq!(recipient_profile.reputation_score, 85); // 100 - 15
    assert_eq!(recipient_profile.failed_contracts, 1);
}

#[test]
fn test_cancel_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin = token::StellarAssetClient::new(&env, &token_address);
    token_admin.mint(&creator, &1000);

    let contract_id = env.register(StellarPayContract, ());
    let client = StellarPayContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    client.create_escrow(&creator, &recipient, &400, &token_address, &1);

    // Cancel escrow (authorized by creator)
    client.cancel_escrow(&1);

    // Verify balances
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&creator), 1000);

    // Status is Cancelled
    let escrow = client.get_escrow(&1).unwrap();
    assert_eq!(escrow.status, EscrowStatus::Cancelled as u32);
}

#[test]
fn test_dispute_and_admin_resolve() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin = token::StellarAssetClient::new(&env, &token_address);
    token_admin.mint(&creator, &1000);

    let contract_id = env.register(StellarPayContract, ());
    let client = StellarPayContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    client.create_escrow(&creator, &recipient, &600, &token_address, &1);

    // Open dispute
    client.open_dispute(&1, &creator, &Symbol::new(&env, "late_delivery"));

    // Check status is Disputed
    let escrow = client.get_escrow(&1).unwrap();
    assert_eq!(escrow.status, EscrowStatus::Disputed as u32);

    // Resolve dispute by admin in favor of creator
    client.resolve_dispute(&1, &creator, &admin);

    // Creator should get refunded
    assert_eq!(token_client.balance(&creator), 1000);
    assert_eq!(token_client.balance(&contract_id), 0);

    // Recipient profile should be marked failed
    let recipient_profile = client.get_profile(&recipient).unwrap();
    assert_eq!(recipient_profile.reputation_score, 85);
    assert_eq!(recipient_profile.failed_contracts, 1);
}
