import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { GasTrackerFields } from './GasTrackerFields';
import { AmazonPriceFields } from './AmazonPriceFields';
import { useCards } from '../../context/CardContext';
import { CardType, type CreateCardDto, type GasTrackerConfig, type AmazonPriceConfig } from '../../types/card';
import { DEFAULT_GAS_CONFIG, DEFAULT_AMAZON_CONFIG, CARD_TYPE_OPTIONS } from '../../config/cardDefaults';
import toast from 'react-hot-toast';

interface AddCardModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddCardModal({ open, onClose }: AddCardModalProps) {
  const { addCard } = useCards();
  const [type, setType] = useState<typeof CardType[keyof typeof CardType]>(CardType.GAS_TRACKER);
  const [title, setTitle] = useState('');
  const [gasConfig, setGasConfig] = useState<GasTrackerConfig>(DEFAULT_GAS_CONFIG);
  const [amazonConfig, setAmazonConfig] = useState<AmazonPriceConfig>(DEFAULT_AMAZON_CONFIG);
  const [saving, setSaving] = useState(false);

  function handleClose() {
    setTitle('');
    setType(CardType.GAS_TRACKER);
    setGasConfig(DEFAULT_GAS_CONFIG);
    setAmazonConfig(DEFAULT_AMAZON_CONFIG);
    onClose();
  }

  async function handleSubmit() {
    if (!title.trim()) { toast.error('Title is required'); return; }

    const dto: CreateCardDto = {
      type,
      title: title.trim(),
      config: type === CardType.GAS_TRACKER ? gasConfig : amazonConfig,
    };

    setSaving(true);
    try {
      await addCard(dto);
      toast.success('Card added');
      handleClose();
    } catch {
      toast.error('Failed to add card');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add New Card">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {CARD_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === CardType.GAS_TRACKER ? 'GTA Gas Prices' : 'My Product'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {type === CardType.GAS_TRACKER && (
          <GasTrackerFields config={gasConfig} onChange={setGasConfig} />
        )}
        {type === CardType.AMAZON_PRICE && (
          <AmazonPriceFields config={amazonConfig} onChange={setAmazonConfig} />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Adding…' : 'Add Card'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

