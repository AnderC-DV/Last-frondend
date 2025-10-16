import React, { useRef, useCallback } from 'react';
import ConversationListItem from './ConversationListItem';

const WppConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  userRole,
  onAddTag,
  scrollContainerRef,
  onLoadMore,
  hasMore,
  isLoading,
}) => {
  const observer = useRef();

  const sentinelRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    }, { root: scrollContainerRef.current, threshold: 0.5 });

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, onLoadMore, scrollContainerRef]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-2">
      <div className="space-y-1">
        {conversations.map((convo) => (
          <ConversationListItem
            key={convo.id}
            conversation={convo}
            isSelected={selectedConversation?.id === convo.id}
            onSelect={onSelectConversation}
            userRole={userRole}
            onAddTag={onAddTag}
          />
        ))}
        {hasMore && (
          <div ref={sentinelRef} style={{ height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isLoading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default WppConversationList;
