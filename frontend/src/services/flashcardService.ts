import api from './api'

export interface FlashcardDeck {
  id: number
  name: string
  description?: string
  note_id?: number
  created_at: string
  card_count: number
}

export interface FlashcardCard {
  id: number
  deck_id: number
  front: string
  back: string
  ease_factor: number
  interval: number
  repetitions: number
  next_review: string
}

export interface DeckCreate {
  name: string
  description?: string
  note_id?: number
}

export interface CardReview {
  card_id: number
  quality: number
}

export const flashcardService = {
  getDecks: async (): Promise<FlashcardDeck[]> => {
    const response = await api.get('/api/flashcards/decks')
    return response.data
  },

  getDeck: async (id: number): Promise<FlashcardDeck> => {
    const response = await api.get(`/api/flashcards/decks/${id}`)
    return response.data
  },

  createDeck: async (data: DeckCreate): Promise<FlashcardDeck> => {
    const response = await api.post('/api/flashcards/decks', data)
    return response.data
  },

  deleteDeck: async (id: number): Promise<void> => {
    await api.delete(`/api/flashcards/decks/${id}`)
  },

  getDueCards: async (deckId: number): Promise<FlashcardCard[]> => {
    const response = await api.get(`/api/flashcards/decks/${deckId}/due`)
    return response.data
  },

  reviewCard: async (data: CardReview): Promise<FlashcardCard> => {
    const response = await api.post('/api/flashcards/review', data)
    return response.data
  },
}
