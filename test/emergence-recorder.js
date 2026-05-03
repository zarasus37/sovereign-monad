const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("EmergenceRecorder", function () {
  async function deployRecorder() {
    const [recorderWallet] = await ethers.getSigners();
    const revenueRouter = ethers.Wallet.createRandom().address;
    const EmergenceRecorder = await ethers.getContractFactory("EmergenceRecorder");
    const recorder = await EmergenceRecorder.deploy(revenueRouter);
    await recorder.waitForDeployment();

    return { recorder, recorderWallet, revenueRouter };
  }

  it("stores Agent 0 profile in queryable storage", async function () {
    const { recorder } = await deployRecorder();
    const agentId = ethers.id("xkryptic-agent-0-genesis");
    const scores = [74, 55, 43, 19, 12, 78, 70, 50];

    await expect(
      recorder.registerAgent(agentId, "TRADING", "GOVERNANCE", "DOCTRINE", scores, true)
    )
      .to.emit(recorder, "AgentRegistered")
      .withArgs(agentId, "TRADING", "GOVERNANCE", "DOCTRINE", true, anyValue);

    const profile = await recorder.profiles(agentId);
    expect(profile.agentId).to.equal(agentId);
    expect(profile.primaryDomain).to.equal("TRADING");
    expect(profile.secondaryDomain).to.equal("GOVERNANCE");
    expect(profile.tertiaryDomain).to.equal("DOCTRINE");
    expect(profile.openness).to.equal(74);
    expect(profile.conscientiousness).to.equal(55);
    expect(profile.extraversion).to.equal(43);
    expect(profile.agreeableness).to.equal(19);
    expect(profile.neuroticism).to.equal(12);
    expect(profile.machiavellianism).to.equal(78);
    expect(profile.narcissism).to.equal(70);
    expect(profile.psychopathy).to.equal(50);
    expect(profile.doveFlag).to.equal(true);
    expect(await recorder.agentCount()).to.equal(1n);
    expect(await recorder.agentIndex(0)).to.equal(agentId);

    await expect(recorder.registerAgent(agentId, "TRADING", "GOVERNANCE", "DOCTRINE", scores, true))
      .to.be.revertedWithCustomError(recorder, "DuplicateAgent");
  });

  it("stores a permanent queryable behavioral claim", async function () {
    const { recorder, recorderWallet, revenueRouter } = await deployRecorder();
    const agentId = ethers.id("Cardia-Genesis-01");
    const decisionHash = ethers.id("decision-payload-v1");
    const timestamp = 1770000000;

    const tx = await recorder.recordClaim(agentId, "TRADING", decisionHash, timestamp);
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((log) => {
        try {
          return recorder.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "EmergenceClaimRecorded");

    expect(await recorder.revenueRouter()).to.equal(revenueRouter);
    expect(await recorder.claimCount()).to.equal(1n);
    expect(event).to.not.equal(null);

    const claimId = event.args.claimId;
    const record = await recorder.getClaim(0);
    expect(record.claimId).to.equal(claimId);
    expect(record.agentId).to.equal(agentId);
    expect(record.domain).to.equal("TRADING");
    expect(record.decisionHash).to.equal(decisionHash);
    expect(record.timestamp).to.equal(timestamp);
    expect(record.recorder).to.equal(recorderWallet.address);

    const byId = await recorder.getClaimById(claimId);
    expect(byId.claimId).to.equal(claimId);

    const agentClaims = await recorder.getAgentClaimIds(agentId);
    expect(agentClaims).to.deep.equal([claimId]);
  });

  it("rejects invalid inputs and duplicate records", async function () {
    const { recorder } = await deployRecorder();
    const agentId = ethers.id("Cardia-Genesis-01");
    const decisionHash = ethers.id("decision-payload-v1");
    const timestamp = 1770000000;

    await expect(recorder.recordClaim(ethers.ZeroHash, "TRADING", decisionHash, timestamp))
      .to.be.revertedWithCustomError(recorder, "InvalidAgentId");
    await expect(recorder.recordClaim(agentId, "", decisionHash, timestamp))
      .to.be.revertedWithCustomError(recorder, "InvalidDomain");
    await expect(recorder.recordClaim(agentId, "TRADING", "", timestamp))
      .to.be.revertedWithCustomError(recorder, "InvalidDecisionHash");
    await expect(recorder.recordClaim(agentId, "TRADING", decisionHash, 0))
      .to.be.revertedWithCustomError(recorder, "InvalidTimestamp");

    await recorder.recordClaim(agentId, "TRADING", decisionHash, timestamp);
    await expect(recorder.recordClaim(agentId, "TRADING", decisionHash, timestamp))
      .to.be.revertedWithCustomError(recorder, "DuplicateClaim");
  });
});
