// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/* eslint-disable react/prop-types */
import React, { useState, useRef } from 'react';
import { API, Logger } from 'aws-amplify';
import { Button, Container, SpaceBetween, FormField, Alert } from '@awsui/components-react';
import chatWithDocument from '../../graphql/queries/chatWithDocument';
import './ChatPanel.css';

const logger = new Logger('chatWithDocument');

const getChatResponse = async (s3Uri, prompt, history) => {
  logger.debug('s3URI:', s3Uri);
  logger.debug('history:', history);
  // commenting this out until model selection for chat is available again on this screen
  // logger.debug('modelId:', modelId);
  const modelId = 'us.amazon.nova-pro-v1:0';
  const strHistory = JSON.stringify(history);
  const response = await API.graphql({
    query: chatWithDocument,
    variables: { s3Uri, prompt, history: strHistory, modelId },
  });
  // logger.debug('response:', response);
  return response;
};

// commenting this out until model selection for chat is available again on this screen
// const modelOptions = [
//   { value: 'us.amazon.nova-lite-v1:0', label: 'Nova Lite' },
//   { value: 'us.amazon.nova-pro-v1:0', label: 'Nova Pro' },
//   { value: 'us.amazon.nova-premier-v1:0', label: 'Nova Premier' },
//   { value: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0', label: 'Claude 3.7 Sonnet' },
//   { value: 'us.anthropic.claude-opus-4-20250514-v1:0', label: 'Claude Opus 4' },
//   { value: 'us.anthropic.claude-sonnet-4-20250514-v1:0', label: 'Claude Sonnet 4' },
// ];

const ChatPanel = (item) => {
  const [error, setError] = useState(null);
  // const [modelId, setModelId] = useState(modelOptions[0].value);
  const [chatQueries, setChatQueries] = useState([]);
  const [jsonChatHistory, setJsonChatHistory] = useState([]);
  const textareaRef = useRef(null);
  const { objectKey } = item;
  let rowId = 0;

  function generateId() {
    rowId += 1;
    return rowId;
  }

  // comment out sending the model ID until model selection is available again on this screen
  // function handleModelIdChange(e) {
  //   setModelId(e.target.value);
  // }

  const handlePromptSubmit = () => {
    const prompt = textareaRef.current.value;

    // logger.debug('selectedModelId:', modelId);

    const chatRequestData = {
      role: 'user',
      content: prompt,
      dt: new Date().toLocaleTimeString(),
      type: 'msg',
    };

    const loadingData = {
      role: 'loader',
      content: 'loader',
    };

    setChatQueries((prevChatQueries) => [...prevChatQueries, chatRequestData, loadingData]);

    textareaRef.current.value = '';

    // comment out sending the model ID until model selection is available again on this screen
    // const chatResponse = getChatResponse(objectKey, prompt, history, modelId);
    const chatResponse = getChatResponse(objectKey, prompt, jsonChatHistory);

    let chatResponseData = {};
    let chatItem = {};

    chatResponse
      .then((r) => {
        if (r.data.chatWithDocument && r.data.chatWithDocument != null) {
          console.log('in the chat with doc response');
          const cResponse = JSON.parse(r.data.chatWithDocument);
          chatResponseData = {
            role: 'ai',
            content: cResponse.cr.content[0].text,
            dt: new Date().toLocaleTimeString(),
            type: 'msg',
          };

          chatItem = {
            ask: prompt,
            response: cResponse.cr.content[0].text,
          };
        }
      })
      .catch((r) => {
        if (r.errors) {
          chatResponseData = {
            role: 'ai',
            content: r.errors[0].message,
            dt: new Date().toLocaleTimeString(),
            type: 'error',
          };
        }
      })
      .finally(() => {
        // remove loader from the chat queries
        setChatQueries((prevChatQueries) => prevChatQueries.filter((data) => data.role !== 'loader'));
        setChatQueries((prevChatQueries) => [...prevChatQueries, chatResponseData]);
        setJsonChatHistory((prevChatHistory) => [...prevChatHistory, chatItem]);
        const maxScrollHeight = document.documentElement.scrollHeight;
        window.scrollTo(0, maxScrollHeight);
      });

    setError(null);
  };

  return (
    <div id="chatDiv">
      <SpaceBetween size="l">
        <Container header={<h2>Chat With the Document</h2>}>
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          {chatQueries.length > 0 ? (
            chatQueries.map((post) => (
              <div className="chat-message-container" key={generateId()}>
                {(() => {
                  switch (post.role) {
                    case 'user':
                      return (
                        <div className="chat-user">
                          <p>
                            {post.content}
                            <br />
                            <span className="time">{post.dt}</span>
                          </p>
                        </div>
                      );
                    case 'loader':
                      return <div className="loader" />;
                    case 'ai':
                      return (
                        <div className={`chat-assistant ${post.type === 'error' ? 'error' : ''}`}>
                          <p>
                            {post.content}
                            <br />
                            <span className="time">{post.dt}</span>
                          </p>
                        </div>
                      );
                    default:
                      return '';
                  }
                })()}
              </div>
            ))
          ) : (
            <p>To start chatting to this document, enter your message below.</p>
          )}

          {/* <FormField label="Your message" className="chat-composer-container">
            <textarea name="postContent" ref={textareaRef} rows={6} className="chat-textarea" id="chatTextarea" />
          </FormField> */}

          <div style={{ gap: '8px', width: '100%' }}>
            <FormField label="Your message" style={{ flex: 8 }}>
              <input
                type="text"
                name="postContent"
                ref={textareaRef}
                style={{ padding: '3px', width: '100%' }}
                id="chatTextarea"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePromptSubmit();
                  }
                }}
              />
            </FormField>

            <Button variant="primary" onClick={handlePromptSubmit}>
              Send
            </Button>
          </div>

          {/* <FormField label="Model">
            <select name="model" id="modelSelect" onChange={handleModelIdChange}>
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField> */}
        </Container>
      </SpaceBetween>
    </div>
  );
};

export default ChatPanel;
