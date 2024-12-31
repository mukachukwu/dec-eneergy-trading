import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const contractOwner = accounts.get("deployer")!;
const producer1 = accounts.get("wallet_1")!;
const producer2 = accounts.get("wallet_2")!;
const consumer1 = accounts.get("wallet_3")!;
const consumer2 = accounts.get("wallet_4")!;

describe("Decentralized Energy Trading Smart Contract", () =>
{
  beforeEach(() =>
  {
    // Reset the simnet before each test
    simnet.mineEmptyBlock(1);
  });

  describe("Producer Registration", () =>
  {
    it("should allow a producer to register", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "register-producer", [100, 5], producer1);
      expect(result).toBeOk(true);
    });

    it("should not allow registration with invalid energy amount", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "register-producer", [0, 5], producer1);
      expect(result).toBeErr(101); // err-invalid-amount
    });

    it("should not allow registration with invalid price", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "register-producer", [100, 0], producer1);
      expect(result).toBeErr(101); // err-invalid-amount
    });
  });

  describe("Consumer Registration", () =>
  {
    it("should allow a consumer to register", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "register-consumer", [], consumer1);
      expect(result).toBeOk(true);
    });
  });

  describe("Energy Purchase", () =>
  {
    beforeEach(() =>
    {
      simnet.callPublicFn("energy-trading", "register-producer", [100, 5], producer1);
      simnet.callPublicFn("energy-trading", "register-consumer", [], consumer1);
    });

    it("should allow a consumer to buy energy", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "buy-energy", [producer1, 20], consumer1);
      expect(result).toBeOk(true);
    });

    it("should fail when trying to buy more energy than available", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "buy-energy", [producer1, 150], consumer1);
      expect(result).toBeErr(103); // err-insufficient-energy
    });

    it("should fail when consumer has insufficient funds", () =>
    {
      // Assuming consumer1 doesn't have enough STX for this large purchase
      const { result } = simnet.callPublicFn("energy-trading", "buy-energy", [producer1, 1000000], consumer1);
      expect(result).toBeErr(104); // err-insufficient-funds
    });
  });

  describe("Energy Update", () =>
  {
    beforeEach(() =>
    {
      simnet.callPublicFn("energy-trading", "register-producer", [100, 5], producer1);
    });

    it("should allow a producer to update their energy amount", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "update-energy", [50], producer1);
      expect(result).toBeOk(true);
    });

    it("should fail when a non-registered producer tries to update energy", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "update-energy", [50], producer2);
      expect(result).toBeErr(102); // err-producer-not-found
    });
  });

  describe("Admin Functions", () =>
  {
    beforeEach(() =>
    {
      simnet.callPublicFn("energy-trading", "register-producer", [100, 5], producer1);
    });

    it("should allow the contract owner to set a new energy price", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "set-energy-price", [producer1, 10], contractOwner);
      expect(result).toBeOk(true);
    });

    it("should not allow non-owners to set energy price", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "set-energy-price", [producer1, 10], consumer1);
      expect(result).toBeErr(100); // err-not-owner
    });

    it("should not allow setting an invalid price", () =>
    {
      const { result } = simnet.callPublicFn("energy-trading", "set-energy-price", [producer1, 0], contractOwner);
      expect(result).toBeErr(101); // err-invalid-amount
    });
  });

  describe("Read-only Functions", () =>
  {
    beforeEach(() =>
    {
      simnet.callPublicFn("energy-trading", "register-producer", [100, 5], producer1);
      simnet.callPublicFn("energy-trading", "register-consumer", [], consumer1);
      simnet.callPublicFn("energy-trading", "buy-energy", [producer1, 20], consumer1);
    });

    it("should return correct producer info", () =>
    {
      const { result } = simnet.callReadOnlyFn("energy-trading", "get-producer-info", [producer1], producer1);
      expect(result).toBeOk({ energy- available: 80, energy - price: 5 });
  });

  it("should return correct consumer info", () =>
  {
    const { result } = simnet.callReadOnlyFn("energy-trading", "get-consumer-info", [consumer1], consumer1);
    expect(result).toBeOk({ energy- consumed: 20, total - spent: 100 });
});

it("should return correct energy sold for a producer", () =>
{
  const { result } = simnet.callReadOnlyFn("energy-trading", "get-energy-sold", [producer1], producer1);
  expect(result).toBeOk(20);
});

it("should return correct energy purchased for a consumer", () =>
{
  const { result } = simnet.callReadOnlyFn("energy-trading", "get-energy-purchased", [consumer1], consumer1);
  expect(result).toBeOk(20);
});
  });
});