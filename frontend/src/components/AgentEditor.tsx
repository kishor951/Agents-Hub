import { useState, useEffect } from 'react'
import { Agent } from '../types'
import axios from 'axios'
import '../styles/AgentEditor.css'

interface AgentEditorProps {
  agent: Agent
  isOpen: boolean
  onClose: () => void
  onSave: (updatedAgent: Agent) => void
}

interface EditableFields {
  name: string
  purpose: string
  instructions: string
  personality: string
  skills: string[]
  llmModel: string
}

interface LLMModel {
  id: string
  name: string
}

const AgentEditor = ({ agent, isOpen, onClose, onSave }: AgentEditorProps) => {
  const [formData, setFormData] = useState<EditableFields>({
    name: agent.name || '',
    purpose: agent.purpose || '',
    instructions: agent.instructions || '',
    personality: agent.personality || '',
    skills: agent.skills || [],
    llmModel: agent.llmModel || 'openai/gpt-3.5-turbo'
  })

  const [availableModels, setAvailableModels] = useState<LLMModel[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadEditFields()
    }
  }, [isOpen, agent.id])

  const loadEditFields = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/agents/${agent.id}/edit-fields`
      )
      setAvailableModels(response.data.availableLLMModels)
      console.log('✅ Loaded edit fields and available models')
    } catch (err) {
      console.error('Failed to load edit fields:', err)
    }
  }

  const handleFieldChange = (field: keyof EditableFields, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
    setError(null)
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      handleFieldChange('skills', [...formData.skills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    handleFieldChange('skills', formData.skills.filter(s => s !== skillToRemove))
  }

  const handleSave = async () => {
    if (!hasChanges) {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      console.log('📤 Saving agent changes:', formData)
      
      const response = await axios.patch(
        `http://localhost:5000/api/agents/${agent.id}/edit`,
        formData
      )

      console.log('✅ Agent saved successfully:', response.data.agent)
      onSave(response.data.agent)
      setHasChanges(false)
      onClose()
    } catch (err: any) {
      const errorMsg = err.response?.data?.details?.join(', ') || 
                       err.response?.data?.error || 
                       'Failed to save agent'
      setError(errorMsg)
      console.error('❌ Failed to save agent:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="agent-editor-overlay" onClick={onClose}>
      <div className="agent-editor-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="editor-header">
          <h2>✏️ Edit Agent</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Form */}
        <div className="editor-form">
          {/* Agent Name */}
          <div className="form-group">
            <label htmlFor="name">Agent Name</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Enter agent name"
              maxLength={100}
            />
            <span className="char-count">{formData.name.length}/100</span>
          </div>

          {/* Purpose */}
          <div className="form-group">
            <label htmlFor="purpose">Purpose</label>
            <textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleFieldChange('purpose', e.target.value)}
              placeholder="What is the agent's main purpose?"
              rows={3}
            />
          </div>

          {/* Instructions */}
          <div className="form-group">
            <label htmlFor="instructions">Instructions</label>
            <textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => handleFieldChange('instructions', e.target.value)}
              placeholder="How should the agent behave?"
              rows={3}
            />
          </div>

          {/* Personality */}
          <div className="form-group">
            <label htmlFor="personality">Personality</label>
            <textarea
              id="personality"
              value={formData.personality}
              onChange={(e) => handleFieldChange('personality', e.target.value)}
              placeholder="Describe the agent's personality..."
              rows={3}
            />
          </div>

          {/* LLM Model */}
          <div className="form-group">
            <label htmlFor="llmModel">LLM Model</label>
            <select
              id="llmModel"
              value={formData.llmModel}
              onChange={(e) => handleFieldChange('llmModel', e.target.value)}
            >
              {availableModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <small className="model-hint">Currently using: {formData.llmModel}</small>
          </div>

          {/* Skills */}
          <div className="form-group">
            <label htmlFor="skillInput">Skills</label>
            <div className="skill-input-group">
              <input
                id="skillInput"
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
                placeholder="Type a skill and press Enter"
              />
              <button 
                type="button"
                className="add-skill-btn"
                onClick={handleAddSkill}
              >
                + Add
              </button>
            </div>
            
            {/* Skills List */}
            <div className="skills-list">
              {formData.skills.map((skill, idx) => (
                <div key={idx} className="skill-tag">
                  <span>{skill}</span>
                  <button
                    className="remove-skill-btn"
                    onClick={() => handleRemoveSkill(skill)}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <small className="skill-hint">{formData.skills.length} skill(s) added</small>
          </div>
        </div>

        {/* Footer */}
        <div className="editor-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? '💾 Saving...' : '✓ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgentEditor
