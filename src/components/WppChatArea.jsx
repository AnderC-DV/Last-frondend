import React from 'react';
import WppChatHeader from './WppChatHeader';
import WppMessageList from './WppMessageList';
import WppMessageInput from './WppMessageInput';

const WppChatArea = ({
  selectedConversation,
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleMediaFileSelect,
  selectedMediaFile,
  handleSendMedia,
  isUploadingMedia,
  onDocumentClick,
  messagesEndRef,
  messagesContainerRef,
  showScrollButton,
  scrollToBottom
}) => {
  return (
    <div className="flex-1 flex flex-col bg-white h-full min-h-0 overflow-hidden">
      <WppChatHeader selectedConversation={selectedConversation} />

      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <WppMessageList
          messages={messages}
          selectedConversation={selectedConversation}
          onDocumentClick={onDocumentClick}
          messagesEndRef={messagesEndRef}
          showScrollButton={showScrollButton}
          scrollToBottom={scrollToBottom}
        />
      </div>

      <WppMessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleMediaFileSelect={handleMediaFileSelect}
        selectedMediaFile={selectedMediaFile}
        handleSendMedia={handleSendMedia}
        isUploadingMedia={isUploadingMedia}
        selectedConversation={selectedConversation}
      />
    </div>
  );
};

export default WppChatArea;
