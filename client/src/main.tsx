// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { UsersProvider } from './contexts/UsersContext.tsx'
import { ConversationsProvider } from './contexts/ConversationsContext.tsx'
import { MessagesProvider } from './contexts/MessagesContext.tsx'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <BrowserRouter>
      <UsersProvider>
        <ConversationsProvider>
          <MessagesProvider>
            <App />
          </MessagesProvider>
          </ConversationsProvider>
        </UsersProvider>
    </BrowserRouter>
  // </StrictMode>
)
