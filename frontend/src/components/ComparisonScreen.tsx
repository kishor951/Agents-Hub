import { useState } from 'react'
import { Agent } from '../types'
import { calculateFusionScore, getScoreInterpretation, FusionScore } from '../utils/fusionScore'

interface ComparisonScreenProps {
  agentA: Agent & { fullData?: any }
  agentB: Agent & { fullData?: any }
  onConfirm: (agentA: Agent, agentB: Agent) => void
  onCancel: () => void
}

const ComparisonScreen = ({ agentA, agentB, onConfirm, onCancel }: ComparisonScreenProps) => {
  const [fusionScore] = useState<FusionScore>(() => calculateFusionScore(agentA, agentB))
  const scoreInterpretation = getScoreInterpretation(fusionScore.overall)

  return (
    <>
      <div className="comparison-backdrop" onClick={onCancel} />

      <div className="comparison-screen">
        {/* Header */}
        <div className="comparison-header">
          <h2>Fusion Compatibility Analysis</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        {/* Score Summary */}
        <div className="score-summary">
          <div className="score-card main-score">
            <div className="score-value" style={{ color: scoreInterpretation.color }}>
              {fusionScore.overall}%
            </div>
            <div className="score-label">Overall Compatibility</div>
            <div className="score-level" style={{ color: scoreInterpretation.color }}>
              {scoreInterpretation.level}
            </div>
            <div className="score-description">{scoreInterpretation.description}</div>
          </div>

          <div className="score-metrics">
            <div className="metric">
              <div className="metric-label">Trait Harmony</div>
              <div className="metric-bar">
                <div
                  className="metric-fill"
                  style={{
                    width: `${fusionScore.traitHarmony}%`,
                    background: 'linear-gradient(90deg, #64c8ff 0%, #4ade80 100%)'
                  }}
                />
              </div>
              <div className="metric-value">{fusionScore.traitHarmony}%</div>
            </div>

            <div className="metric">
              <div className="metric-label">Skill Synergy</div>
              <div className="metric-bar">
                <div
                  className="metric-fill"
                  style={{
                    width: `${fusionScore.skillSynergy}%`,
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                  }}
                />
              </div>
              <div className="metric-value">{fusionScore.skillSynergy}%</div>
            </div>

            <div className="metric">
              <div className="metric-label">Compatibility</div>
              <div className="metric-bar">
                <div
                  className="metric-fill"
                  style={{
                    width: `${fusionScore.compatibility}%`,
                    background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
                  }}
                />
              </div>
              <div className="metric-value">{fusionScore.compatibility}%</div>
            </div>
          </div>
        </div>

        {/* Main Comparison */}
        <div className="comparison-content">
          {/* Agents Side by Side */}
          <div className="agents-comparison">
            <div className="agent-column">
              <div className="agent-header">
                <div className="agent-avatar">
                  {agentA.imageUrl && agentA.imageUrl.startsWith('http') ? (
                    <img src={agentA.imageUrl} alt={agentA.name} className="agent-comparison-img" />
                  ) : (
                    agentA.imageUrl || '🤖'
                  )}
                </div>
                <h3>{agentA.name}</h3>
                <p className="agent-domain">
                  {agentA.fullData?.specialization?.primary_domain || 'General'}
                </p>
              </div>

              {/* Traits */}
              <div className="agent-section">
                <h4>Traits</h4>
                <div className="traits-list">
                  {agentA.fullData?.personality?.traits?.slice(0, 4).map((trait: string) => (
                    <span key={trait} className="trait">{trait}</span>
                  ))}
                </div>
              </div>

              {/* Top Skills */}
              <div className="agent-section">
                <h4>Top Skills</h4>
                <div className="skills-list">
                  {agentA.fullData?.skills?.languages?.slice(0, 5).map((skill: any) => (
                    <div key={skill.name} className="skill">
                      <span>{skill.name}</span>
                      <span className="proficiency">{skill.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Focus Areas */}
              <div className="agent-section">
                <h4>Focus Areas</h4>
                <ul className="focus-list">
                  {agentA.fullData?.specialization?.focus_areas?.slice(0, 3).map((area: string) => (
                    <li key={area}>{area}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* vs Symbol */}
            <div className="vs-divider">
              <div className="vs-circle">VS</div>
            </div>

            <div className="agent-column">
              <div className="agent-header">
                <div className="agent-avatar">
                  {agentB.imageUrl && agentB.imageUrl.startsWith('http') ? (
                    <img src={agentB.imageUrl} alt={agentB.name} className="agent-comparison-img" />
                  ) : (
                    agentB.imageUrl || '🤖'
                  )}
                </div>
                <h3>{agentB.name}</h3>
                <p className="agent-domain">
                  {agentB.fullData?.specialization?.primary_domain || 'General'}
                </p>
              </div>

              {/* Traits */}
              <div className="agent-section">
                <h4>Traits</h4>
                <div className="traits-list">
                  {agentB.fullData?.personality?.traits?.slice(0, 4).map((trait: string) => (
                    <span key={trait} className="trait">{trait}</span>
                  ))}
                </div>
              </div>

              {/* Top Skills */}
              <div className="agent-section">
                <h4>Top Skills</h4>
                <div className="skills-list">
                  {agentB.fullData?.skills?.languages?.slice(0, 5).map((skill: any) => (
                    <div key={skill.name} className="skill">
                      <span>{skill.name}</span>
                      <span className="proficiency">{skill.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Focus Areas */}
              <div className="agent-section">
                <h4>Focus Areas</h4>
                <ul className="focus-list">
                  {agentB.fullData?.specialization?.focus_areas?.slice(0, 3).map((area: string) => (
                    <li key={area}>{area}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Analysis */}
          <div className="analysis-section">
            <h3>Fusion Analysis</h3>

            {/* Recommendations */}
            <div className="recommendations">
              <h4>Key Insights</h4>
              <div className="recommendation-list">
                {fusionScore.recommendations.map((rec, idx) => (
                  <div key={idx} className="recommendation-item">
                    {rec.includes('Great') && <span className="icon">✓</span>}
                    {rec.includes('Excellent') && <span className="icon">⭐</span>}
                    {rec.includes('Highly') && <span className="icon">🎯</span>}
                    {rec.includes('⚠') && <span className="icon">⚠</span>}
                    {rec.includes('ℹ') && <span className="icon">ℹ</span>}
                    {rec.includes('Risky') && <span className="icon">❌</span>}
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trait Combination */}
            {fusionScore.traits.complementary.length > 0 && (
              <div className="trait-analysis">
                <h4>Trait Synergies</h4>
                <div className="trait-items">
                  {fusionScore.traits.complementary.map((trait, idx) => (
                    <div key={idx} className="trait-item good">
                      <span className="marker">✓</span>
                      <span>{trait}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Combination */}
            <div className="skill-analysis">
              <h4>Skill Combination</h4>
              <div className="skill-stats">
                <div className="stat">
                  <span className="stat-label">Unique Skills</span>
                  <span className="stat-value">{fusionScore.skillCombination.unique.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Shared Expertise</span>
                  <span className="stat-value">{fusionScore.skillCombination.duplicate.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Skills</span>
                  <span className="stat-value">{fusionScore.skillCombination.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="comparison-footer">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-confirm"
            onClick={() => {
              onConfirm(agentA, agentB)
            }}
          >
            Proceed with Breeding 🧬
          </button>
        </div>
      </div>

      <style>{`
        .comparison-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 999;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .comparison-screen {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 95%;
          max-width: 1200px;
          max-height: 90vh;
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
          border: 1px solid #444;
          border-radius: 16px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.9);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { 
            transform: translate(-50%, -45%);
            opacity: 0;
          }
          to { 
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }

        .comparison-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem;
          border-bottom: 1px solid #444;
        }

        .comparison-header h2 {
          margin: 0;
          color: #fff;
          font-size: 1.8rem;
        }

        .close-btn {
          background: none;
          border: none;
          color: #aaa;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #fff;
        }

        .comparison-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .score-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .score-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #444;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .score-card.main-score {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border: 2px solid rgba(102, 126, 234, 0.3);
        }

        .score-value {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .score-label {
          color: #aaa;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .score-level {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .score-description {
          color: #ddd;
          font-size: 0.85rem;
        }

        .score-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .metric {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #444;
          border-radius: 8px;
          padding: 1rem;
        }

        .metric-label {
          color: #aaa;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .metric-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .metric-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .metric-value {
          color: #fff;
          font-weight: 600;
          font-size: 0.9rem;
          text-align: right;
        }

        .agents-comparison {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 2rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #444;
        }

        .agent-column {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .agent-header {
          text-align: center;
          margin-bottom: 1rem;
        }

        .agent-avatar {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          width: 80px;
          height: 80px;
          margin-left: auto;
          margin-right: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .agent-comparison-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid rgba(100, 200, 255, 0.3);
        }

        .agent-header h3 {
          margin: 0.5rem 0;
          color: #fff;
          font-size: 1.3rem;
        }

        .agent-domain {
          margin: 0;
          color: #64c8ff;
          font-size: 0.85rem;
        }

        .agent-section {
          border-left: 2px solid #444;
          padding-left: 1rem;
        }

        .agent-section h4 {
          margin: 0 0 0.5rem 0;
          color: #64c8ff;
          font-size: 0.9rem;
        }

        .traits-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .trait {
          background: rgba(100, 200, 255, 0.15);
          color: #64c8ff;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .skills-list,
        .focus-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .skill {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #ddd;
        }

        .proficiency {
          color: #4ade80;
          font-weight: 600;
        }

        .focus-list {
          margin: 0;
          padding-left: 1.5rem;
          list-style: none;
        }

        .focus-list li {
          color: #ddd;
          font-size: 0.85rem;
          position: relative;
          padding-left: 0.5rem;
        }

        .focus-list li:before {
          content: "▸";
          position: absolute;
          left: -1rem;
          color: #4ade80;
        }

        .vs-divider {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vs-circle {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .analysis-section {
          background: rgba(0, 0, 0, 0.2);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #444;
        }

        .analysis-section h3 {
          margin: 0 0 1rem 0;
          color: #fff;
        }

        .analysis-section h4 {
          margin: 0 0 0.8rem 0;
          color: #64c8ff;
          font-size: 0.95rem;
        }

        .recommendations {
          margin-bottom: 1.5rem;
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .recommendation-item {
          display: flex;
          align-items: flex-start;
          gap: 0.8rem;
          color: #ddd;
          font-size: 0.9rem;
        }

        .icon {
          font-size: 1rem;
          min-width: 1.5rem;
        }

        .trait-analysis {
          margin-bottom: 1.5rem;
        }

        .trait-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .trait-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.85rem;
        }

        .trait-item.good {
          background: rgba(74, 222, 128, 0.1);
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.2);
        }

        .marker {
          font-weight: bold;
        }

        .skill-analysis {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
        }

        .skill-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.8rem;
        }

        .stat {
          background: rgba(0, 0, 0, 0.2);
          padding: 0.8rem;
          border-radius: 6px;
          border: 1px solid #444;
          text-align: center;
        }

        .stat-label {
          display: block;
          color: #aaa;
          font-size: 0.75rem;
          margin-bottom: 0.4rem;
        }

        .stat-value {
          display: block;
          color: #64c8ff;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .comparison-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #444;
          background: rgba(0, 0, 0, 0.3);
        }

        .btn-cancel,
        .btn-confirm {
          flex: 1;
          padding: 0.9rem 2rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: #ddd;
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .btn-confirm {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .comparison-content::-webkit-scrollbar {
          width: 6px;
        }

        .comparison-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .comparison-content::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 3px;
        }

        .comparison-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        @media (max-width: 1024px) {
          .agents-comparison {
            grid-template-columns: 1fr;
          }

          .vs-divider {
            height: 40px;
            writing-mode: vertical-rl;
            text-orientation: mixed;
          }

          .skill-analysis {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .comparison-screen {
            width: 98%;
            max-height: 95vh;
          }

          .score-summary {
            grid-template-columns: 1fr;
          }

          .comparison-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  )
}

export default ComparisonScreen
