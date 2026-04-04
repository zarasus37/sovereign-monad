import { buildCortexSnapshot, synthesizeBrief } from '../src/cortex';
import { buildVoxSnapshot, packageNarrative } from '../src/vox';

describe('synthesizeBrief', () => {
  it('creates monetizable briefs with sellable next actions', () => {
    const brief = synthesizeBrief({
      id: 'brief-1',
      title: 'Liquidity compression',
      summary: 'Thresholds need adjustment.',
      confidence: 'high',
      urgency: 'normal',
      monetizable: true,
      audience: 'buyers',
      recommendedOrgans: ['Vox', 'Pneuma'],
    });

    expect(brief.monetizable).toBe(true);
    expect(brief.recommendedNextAction).toContain('sellable or distributable brief');
  });
});

describe('packageNarrative', () => {
  it('packages a Cortex brief into a Vox narrative asset', () => {
    const packageResult = packageNarrative(
      {
        id: 'vox-1',
        sourceBriefId: 'brief-1',
        format: 'newsletter',
        audience: 'buyers',
        urgency: 'normal',
      },
      [
        {
          sourceId: 'brief-1',
          title: 'Liquidity compression',
          thesis: 'Thresholds need adjustment.',
          targetAudience: 'buyers',
          monetizable: true,
          recommendedNextAction: 'Package for Vox and Pneuma.',
        },
      ],
    );

    expect(packageResult.channel).toBe('newsletter');
    expect(packageResult.headline).toContain('Liquidity compression');
  });
});

describe('Cortex + Vox snapshots', () => {
  it('builds briefs and narrative packages together', () => {
    const cortex = buildCortexSnapshot([
      {
        id: 'brief-1',
        title: 'Liquidity compression',
        summary: 'Thresholds need adjustment.',
        confidence: 'high',
        urgency: 'normal',
        monetizable: true,
        audience: 'buyers',
        recommendedOrgans: ['Vox', 'Pneuma'],
      },
    ]);

    const vox = buildVoxSnapshot(
      [
        {
          id: 'vox-1',
          sourceBriefId: 'brief-1',
          format: 'newsletter',
          audience: 'buyers',
          urgency: 'normal',
        },
      ],
      cortex.briefs,
    );

    expect(cortex.sourceCount).toBe(1);
    expect(vox.requestCount).toBe(1);
    expect(vox.packages[0].channel).toBe('newsletter');
  });
});
