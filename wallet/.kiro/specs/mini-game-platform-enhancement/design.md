# Design Document: Mini-Game Platform Enhancement

## Overview

This design transforms the existing Scrolly mini-game app from a scrolling feed of simultaneous games into a polished, section-based gaming platform. The core architectural change introduces a two-level navigation system: section selection (Feed/Casino/Kids) followed by game selection within each section, then full-screen game play with clear back navigation.

The design maintains the existing React/TypeScript/Tailwind stack while implementing a clean state management pattern using React hooks. A simulated wallet system provides casino game functionality, and enhanced keyboard controls improve game accessibility.

## Architecture

### Navigation State Architecture

The app uses a hierarchical state management approach with three levels:

```typescript
type NavigationState = {
  activeSection: 'FEED' | 'CASINO' | 'KIDS'
  activeGame: string | null
  gameState: Record<string, any>
}
```

**State Flow:**
1. **Section Level**: User selects Feed/Casino/Kids tab
2. **Selection Level**: User sees game cards for that section  
3. **Game Level**: User plays selected game full-screen
4. **Back Navigation**: User returns to selection level

### Component Hierarchy

```
HomeView (Root State Manager)
├── Header (Wallet Display)
├── TabNavigation (Section Selection)
├── GameSelectionScreen (Conditional Render)
│   ├── GameCard (Feed: Snake, Sudoku, DragonJump)
│   ├── GameCard (Casino: Dice, Coin, Crash)
│   └── GameCard (Kids: Math, Memory)
└── GamePlayScreen (Conditional Render)
    ├── BackButton
    └── ActiveGameComponent
```

### State Management Pattern

Using React's built-in state management with strategic state lifting:

- **Navigation State**: Managed in HomeView root component
- **Wallet State**: Global state using existing Zustand store pattern
- **Game State**: Local state within individual game components
- **Event Cleanup**: Proper useEffect cleanup for keyboard listeners

## Components and Interfaces

### Core Navigation Components

**GameSelectionScreen Component:**
```typescript
interface GameSelectionScreenProps {
  section: 'FEED' | 'CASINO' | 'KIDS'
  onGameSelect: (gameId: string) => void
}
```

Renders a grid of game cards with consistent styling. Each card displays:
- Game name and icon
- Brief description
- Prominent "Play" button
- Visual feedback on hover/touch

**GamePlayScreen Component:**
```typescript
interface GamePlayScreenProps {
  gameId: string
  onBack: () => void
  children: React.ReactNode
}
```

Provides full-screen game container with:
- Clear back button (← arrow + "Back" text)
- Game-specific content area
- Consistent styling framework

### Enhanced Game Components

**Snake Game Enhancements:**
- Keyboard event listener with proper cleanup
- Opposite-direction prevention logic
- Restart functionality that resets all state
- Performance optimization for smooth gameplay

**Sudoku Game Improvements:**
- Input field restrictions (digits 1-9 only)
- CSS hiding of number input arrows
- Auto-clear invalid input
- Visual feedback for correct/incorrect entries

**DragonJump (Sky Rush) Keyboard Controls:**
- Space bar or arrow key jump triggers
- Event listener management
- Touch and keyboard dual support

### New Memory Game Component

**Memory Match Game:**
```typescript
interface MemoryCard {
  id: string
  symbol: string
  isFlipped: boolean
  isMatched: boolean
}

interface MemoryGameState {
  cards: MemoryCard[]
  flippedCards: string[]
  matches: number
  moves: number
}
```

**Game Logic:**
- 4x3 grid (12 cards, 6 pairs) for lightweight performance
- Card flip animation with CSS transitions
- Match detection with 1-second reveal delay
- Success feedback and restart capability
- Touch-optimized card sizing (minimum 44px touch targets)

## Data Models

### Wallet System

```typescript
interface WalletState {
  balance: number
  transactions: Transaction[]
}

interface Transaction {
  id: string
  type: 'bet' | 'win' | 'lose'
  amount: number
  game: string
  timestamp: Date
}
```

**Wallet Operations:**
- `placeBet(amount: number, game: string): boolean`
- `addWinnings(amount: number, game: string): void`
- `getBalance(): number`
- `resetBalance(): void`

### Game State Management

```typescript
interface GameState {
  snake: {
    position: Point[]
    direction: Direction
    food: Point
    score: number
    gameOver: boolean
  }
  sudoku: {
    board: number[]
    solution: number[]
    completed: boolean
  }
  memory: {
    cards: MemoryCard[]
    flippedCards: string[]
    gameComplete: boolean
  }
  casino: {
    lastResult: string
    isPlaying: boolean
    currentBet: number
  }
}
```

### Navigation State

```typescript
interface NavigationState {
  activeSection: Section
  activeGame: string | null
  previousSection: Section | null
}

type Section = 'FEED' | 'CASINO' | 'KIDS'
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After reviewing the prework analysis, several properties can be consolidated to eliminate redundancy and focus on unique validation value:

**Property 1: Section Navigation Consistency**
*For any* section selection (Feed/Casino/Kids), the game platform should display the correct game selection screen with appropriate game cards containing name, icon, and play button.
**Validates: Requirements 1.1, 1.2**

**Property 2: Game Transition Flow**
*For any* game selection, clicking the play button should transition to game play mode where only that specific game is visible and a back button is present.
**Validates: Requirements 1.3, 1.4, 1.5**

**Property 3: Snake Movement Controls**
*For any* valid direction input during Snake gameplay, the game should respond to keyboard arrow keys while preventing opposite-direction movement bugs.
**Validates: Requirements 2.2, 2.3**

**Property 4: Snake State Reset**
*For any* Snake game state, using the restart functionality should return the game to its initial state (position, score, direction).
**Validates: Requirements 2.4**

**Property 5: Sudoku Input Validation**
*For any* input attempt in Sudoku, only digits 1-9 should be accepted, limited to one digit per cell, with invalid inputs automatically cleared.
**Validates: Requirements 2.6, 2.7, 2.8**

**Property 6: Wallet Balance Visibility**
*For any* navigation state in the app, the current wallet balance should be displayed at the top of the screen with coin/chip styling.
**Validates: Requirements 3.2, 6.4**

**Property 7: Casino Betting Mechanics**
*For any* casino game interaction, bets should be deducted immediately, games should allow betting up to available balance, and wins/losses should update balance correctly.
**Validates: Requirements 3.3, 3.4, 3.6, 3.7**

**Property 8: Casino Result Display**
*For any* casino game conclusion, the outcome should be clearly displayed to the user.
**Validates: Requirements 3.5**

**Property 9: Memory Game Card Interaction**
*For any* memory game state, cards should start face-down, flip when clicked, and provide appropriate match/no-match feedback when two cards are revealed.
**Validates: Requirements 4.2, 4.3, 4.4**

**Property 10: Memory Game Completion**
*For any* memory game where all matches are found, success feedback should be displayed.
**Validates: Requirements 4.5**

**Property 11: Sky Rush Keyboard Controls**
*For any* keyboard input during Sky Rush gameplay, jump actions should execute immediately when the jump key is pressed.
**Validates: Requirements 5.1, 5.2**

**Property 12: UI Consistency and Accessibility**
*For any* interactive element across the platform, it should meet minimum touch target sizes (44px) and maintain consistent styling.
**Validates: Requirements 4.6, 6.1, 6.3, 6.6, 8.5**

**Property 13: Visual Hierarchy Maintenance**
*For any* game mode, the visual hierarchy should be maintained with wallet at top, navigation below, then game content.
**Validates: Requirements 6.5**

**Property 14: Navigation State Management**
*For any* navigation transition, the platform should ensure only one game is active at a time, preserve appropriate game states when switching sections, and reset active game state when returning to selection screens.
**Validates: Requirements 7.2, 7.3, 7.4**

**Property 15: Error-Free Operation**
*For any* normal user interaction, the platform should operate without generating console errors.
**Validates: Requirements 8.1**

<function_calls>
<invoke name="prework">
<parameter name="featureName">mini-game-platform-enhancement

## Error Handling

### Navigation Error Recovery

**Invalid State Handling:**
- If navigation state becomes corrupted, reset to default (Feed section, no active game)
- Graceful fallback when game components fail to load
- Clear error boundaries around individual games to prevent app-wide crashes

**Game State Recovery:**
- Snake: Reset to initial position if invalid state detected
- Sudoku: Validate board state and reset invalid cells
- Memory: Shuffle and reset if card state becomes inconsistent
- Casino: Reset betting state if balance becomes negative

### Input Validation

**Keyboard Event Handling:**
- Debounce rapid key presses to prevent state corruption
- Validate key codes before processing game actions
- Graceful handling of simultaneous key presses

**Touch Input Validation:**
- Prevent double-tap issues on game cards
- Validate touch coordinates for memory game cards
- Handle rapid successive touches gracefully

### Resource Management

**Event Listener Cleanup:**
```typescript
useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    // Game logic
  };
  
  window.addEventListener('keydown', handleKeyPress);
  
  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}, [gameState]);
```

**Memory Leak Prevention:**
- Clear intervals and timeouts on component unmount
- Remove event listeners when switching games
- Reset game states appropriately to prevent accumulation

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests as complementary approaches:

**Unit Tests** focus on:
- Specific examples and edge cases
- Integration points between components
- Error conditions and boundary values
- Component rendering with specific props

**Property-Based Tests** focus on:
- Universal properties across all inputs
- Comprehensive input coverage through randomization
- Correctness properties from the design document
- State invariants and behavioral consistency

### Property-Based Testing Configuration

**Framework Selection:** Fast-check for TypeScript/React applications
- Minimum 100 iterations per property test
- Each test tagged with feature and property reference
- Tag format: **Feature: mini-game-platform-enhancement, Property {number}: {property_text}**

**Test Categories:**

1. **Navigation Properties** (Properties 1-2)
   - Generate random section selections and game choices
   - Verify correct UI state transitions
   - Test back navigation functionality

2. **Game Logic Properties** (Properties 3-5, 9-11)
   - Generate random game inputs and states
   - Verify game rules and constraints
   - Test state reset and recovery

3. **Wallet System Properties** (Properties 6-8)
   - Generate random bet amounts and game outcomes
   - Verify balance calculations and constraints
   - Test edge cases (zero balance, maximum bets)

4. **UI Consistency Properties** (Properties 12-13)
   - Generate random component states
   - Verify styling and accessibility requirements
   - Test responsive behavior

5. **State Management Properties** (Properties 14-15)
   - Generate random navigation sequences
   - Verify state isolation and cleanup
   - Test error-free operation

### Unit Testing Focus Areas

**Component Integration:**
- Game selection to game play transitions
- Wallet balance updates across components
- Back button functionality from all games

**Edge Cases:**
- Empty wallet balance scenarios
- Invalid Sudoku inputs
- Memory game with rapid card clicks
- Snake boundary collisions

**Error Conditions:**
- Network disconnection during wallet operations
- Invalid keyboard inputs
- Component mounting/unmounting edge cases

### Testing Implementation Notes

- Property tests validate universal correctness across many inputs
- Unit tests catch specific bugs and integration issues
- Both approaches together provide comprehensive coverage
- Focus on the three demo-critical flows: wallet visibility/updates, Snake controls, and casino betting mechanics