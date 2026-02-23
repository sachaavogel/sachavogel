import { useState } from 'react'
import Button from '../ui/Button'

const InstrumentSelector = ({ instruments, onChange }) => {
  const [newInstrument, setNewInstrument] = useState('')

  const addInstrument = () => {
    const trimmed = newInstrument.trim()
    if (trimmed && !instruments.includes(trimmed)) {
      onChange([...instruments, trimmed])
      setNewInstrument('')
    }
  }

  const removeInstrument = (inst) => {
    onChange(instruments.filter(i => i !== inst))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addInstrument()
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-cartoon-text mb-2">
        Instruments
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {instruments.map(inst => (
          <span key={inst} className="inline-flex items-center px-3 py-1 bg-cartoon-accent text-cartoon-text rounded-full text-sm font-medium">
            {inst}
            <button
              type="button"
              onClick={() => removeInstrument(inst)}
              className="ml-2 hover:text-red-500 focus:outline-none"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newInstrument}
          onChange={(e) => setNewInstrument(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add instrument..."
          className="input flex-1"
        />
        <Button type="button" onClick={addInstrument} variant="secondary" size="small">
          Add
        </Button>
      </div>
    </div>
  )
}

export default InstrumentSelector
