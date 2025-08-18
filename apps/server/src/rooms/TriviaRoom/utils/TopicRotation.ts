import { TriviaRoomState } from "../../schema/TriviaRoomState";

/**
 * Simple helpers to rotate topics round-robin and to set topics.
 */
export const rotateToNextTopic = (state: TriviaRoomState): void => {
  const allTopics = state.topics || [];
  if (allTopics.length === 0) return;
  state.currentTopicIndex = (state.currentTopicIndex + 1) % allTopics.length;
  state.currentTopic = allTopics[state.currentTopicIndex];
};

export const resetTopicPosition = (state: TriviaRoomState): void => {
  if (state.topics && state.topics.length > 0) {
    state.currentTopicIndex = 0;
    state.currentTopic = state.topics[0];
  } else {
    state.currentTopicIndex = 0;
    state.currentTopic = "";
  }
};


