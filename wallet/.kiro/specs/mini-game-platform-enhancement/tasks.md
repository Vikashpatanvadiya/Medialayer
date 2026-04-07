# Implementation Plan: Mini-Game Platform Enhancement

## Overview

Transform the existing Scrolly app from a scrolling feed into a section-based gaming platform with game selection screens, full-screen game play, wallet integration, and enhanced controls. Implementation focuses on state management, UI restructuring, and adding the memory game while maintaining existing functionality.

## Tasks

- [ ] 1. Implement core navigation state management
  - Create navigation state types and interfaces in existing HomeView component
  - Implement section selection state (Feed/Casino/Kids)
  - Add active game state management with proper state lifting
  - _Requirements: 1.1, 7.1, 7.4_

- [ ] 1.1 Write property tests for navigation state management
  - **Property 1: Section Navigation Consistency**
  - **Property 2: Game Transition Flow**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [ ] 2. Create game selection screen components
  - Build GameSelectionScreen component with section-specific game cards
  - Implement GameCard component with name, icon, and play button
  - Add consistent card styling across all sections
  - _Requirements: 1.2, 6.1_

- [ ] 2.1 Write property tests for game selection UI
  - **Property 12: UI Consistency and Accessibility**
  - **Validates: Requirements 1.2, 6.1, 6.3**

- [ ] 3. Implement game play screen with back navigation
  - Create GamePlayScreen wrapper component
  - Add back button with clear visibility and accessibility
  - Implement one-game-at-a-time display logic
  - _Requirements: 1.4, 1.5, 6.6_

- [ ] 3.1 Write unit tests for back navigation
  - Test back button functionality from all games
  - Test game isolation and visibility
  - _Requirements: 1.4, 1.5_

- [ ] 4. Enhance Snake game with keyboard controls and cleanup
  - Add proper keyboard event listeners with useEffect cleanup
  - Implement opposite-direction movement prevention
  - Enhance restart functionality to reset all game state
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 4.1 Write property tests for Snake game mechanics
  - **Property 3: Snake Movement Controls**
  - **Property 4: Snake State Reset**
  - **Validates: Requirements 2.2, 2.3, 2.4**

- [ ] 5. Improve Sudoku input handling and validation
  - Modify input fields to accept only digits 1-9
  - Hide up/down arrows with CSS styling
  - Implement automatic invalid input clearing
  - Limit input to one digit per cell
  - _Requirements: 2.6, 2.7, 2.8_

- [ ] 5.1 Write property tests for Sudoku input validation
  - **Property 5: Sudoku Input Validation**
  - **Validates: Requirements 2.6, 2.7, 2.8**

- [x] 6. Implement simulated wallet system
  - Create wallet state management with 1000 coin default balance
  - Add wallet balance display at top of screen with coin/chip styling
  - Implement bet placement and balance deduction logic
  - Add win/lose balance update functionality
  - _Requirements: 3.1, 3.2, 3.6, 3.7, 6.4_

- [ ] 6.1 Write property tests for wallet system
  - **Property 6: Wallet Balance Visibility**
  - **Property 7: Casino Betting Mechanics**
  - **Validates: Requirements 3.2, 3.3, 3.4, 3.6, 3.7, 6.4**

- [ ] 7. Enhance casino games with wallet integration
  - Modify existing casino games to use wallet balance for betting
  - Add clear result display for win/lose outcomes
  - Implement immediate balance updates on game conclusion
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 7.1 Write property tests for casino game integration
  - **Property 8: Casino Result Display**
  - **Validates: Requirements 3.3, 3.4, 3.5**

- [ ] 8. Add keyboard controls to Sky Rush (DragonJump)
  - Implement keyboard event listener for jump actions (space bar or arrow keys)
  - Add proper event cleanup on component unmount
  - Maintain existing touch controls alongside keyboard
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 8.1 Write property tests for Sky Rush keyboard controls
  - **Property 11: Sky Rush Keyboard Controls**
  - **Validates: Requirements 5.1, 5.2**

- [ ] 9. Create memory match game for Kids section
  - Build MemoryGame component with 4x3 card grid
  - Implement card flip animations and match detection logic
  - Add touch-friendly card sizing (minimum 44px touch targets)
  - Create success feedback and restart functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 9.1 Write property tests for memory game mechanics
  - **Property 9: Memory Game Card Interaction**
  - **Property 10: Memory Game Completion**
  - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

- [ ] 9.2 Write unit tests for memory game edge cases
  - Test rapid card clicking scenarios
  - Test game completion detection
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 10. Implement visual hierarchy and UI polish
  - Ensure wallet display at top, navigation below, game content at bottom
  - Apply consistent styling and smooth transitions
  - Optimize button sizes for touch accessibility
  - _Requirements: 6.2, 6.3, 6.5_

- [ ] 10.1 Write property tests for visual hierarchy
  - **Property 13: Visual Hierarchy Maintenance**
  - **Validates: Requirements 6.5**

- [ ] 11. Checkpoint - Ensure all tests pass and core functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement state management and cleanup
  - Add proper game state preservation when switching sections
  - Implement active game state reset when returning to selection
  - Add resource cleanup for event listeners and intervals
  - _Requirements: 7.2, 7.3, 7.5_

- [ ] 12.1 Write property tests for state management
  - **Property 14: Navigation State Management**
  - **Validates: Requirements 7.2, 7.3, 7.4**

- [ ] 13. Add error handling and performance optimization
  - Implement error boundaries around individual games
  - Add input validation and debouncing for rapid interactions
  - Ensure mobile responsiveness and touch-friendly interactions
  - _Requirements: 8.1, 8.5_

- [ ] 13.1 Write property tests for error-free operation
  - **Property 15: Error-Free Operation**
  - **Validates: Requirements 8.1**

- [ ] 14. Final integration and polish
  - Wire all components together in HomeView
  - Test complete navigation flow: section → selection → game → back
  - Verify all three demo-critical flows work smoothly
  - _Requirements: All requirements integration_

- [ ] 14.1 Write integration tests for complete user flows
  - Test end-to-end navigation sequences
  - Test wallet balance updates across different games
  - _Requirements: Complete flow validation_

- [ ] 15. Final checkpoint - Comprehensive testing and validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive development with testing throughout
- Each task references specific requirements for traceability
- Focus on three demo-critical flows: wallet visibility/updates, Snake controls, casino betting
- Property tests validate universal correctness across many inputs
- Unit tests validate specific examples and edge cases
- All implementation should work within existing HomeView component structure