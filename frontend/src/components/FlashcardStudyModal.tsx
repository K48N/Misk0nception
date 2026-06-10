import { useEffect, useState } from 'react';
import Modal from './Modal';
import { flashcardService, FlashcardCard } from '../services/flashcardService';

interface FlashcardStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: number;
}

export default function FlashcardStudyModal({ isOpen, onClose, deckId }: FlashcardStudyModalProps) {
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      flashcardService.getDueCards(deckId).then((data) => {
        setCards(data);
        setCurrent(0);
        setShowBack(false);
        setLoading(false);
      });
    }
  }, [isOpen, deckId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Study Flashcards">
      {loading ? (
        <div>Loading...</div>
      ) : cards.length === 0 ? (
        <div>No cards to review in this deck.</div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="card p-6 mb-4 w-full max-w-md text-center">
            <div className="text-lg font-semibold mb-2">Card {current + 1} of {cards.length}</div>
            <div className="text-2xl mb-4 cursor-pointer" onClick={() => setShowBack(!showBack)}>
              {showBack ? cards[current].back : cards[current].front}
            </div>
            <button className="btn-primary" onClick={() => setShowBack(!showBack)}>
              {showBack ? 'Show Front' : 'Show Back'}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              Previous
            </button>
            <button
              className="btn-secondary"
              onClick={() => setCurrent((c) => Math.min(cards.length - 1, c + 1))}
              disabled={current === cards.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
