import React from "react";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import "./App.css";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ToastContainerWrapper } from "./components/common/ToastContainer";
import useSip from "./hooks/useSip";
import WebSocketManager from "./hooks/WebSocketManager";
import ConfirmPassword from "./pages/auth/ConfirmPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Error from "./pages/error/Error";
import HistoryComponent from "./pages/history/HistoryComponent";
import PhoneComponent from "./pages/phone/PhoneComponent";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import { persistor, store } from "./store/Index";
import { BrowserRouter, Route, Routes } from "react-router";
import Index from "./components/layout";

// Lazy loading
const Dashboard = React.lazy(() => import("./pages/dashboard/Dashboard"));
const User = React.lazy(() => import("./pages/users/User"));
const Organizations = React.lazy(() =>
  import("./pages/organizations/Organizations")
);
const VoiceMail = React.lazy(() => import("./pages/voice/VoiceMail"));
const ContactComponent = React.lazy(() =>
  import("./pages/contacts/ContactComponent")
);
const ChatMessage = React.lazy(() => import("./pages/chat/ChatMessage"));

const SIPInitializer = () => {
  useSip();
  return null;
};

function AppContent() {
  const uuid = useSelector((state) => state.auth?.user?.data?.uuid);

  return (
    <>
      <PersistGate loading={null} persistor={persistor}>
        <ErrorBoundary>
          {uuid && (
            <>
              <SIPInitializer />
              <WebSocketManager />
            </>
          )}
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/confirm-password"
                element={
                  <PublicRoute>
                    <ConfirmPassword />
                  </PublicRoute>
                }
              />

              {/* Private Routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Index />
                  </PrivateRoute>
                }
              >
                <Route index path="/" element={<Dashboard />} />
                <Route path="/users" element={<User />} />
                <Route path="/organizations" element={<Organizations />} />
                <Route path="/calls" element={<PhoneComponent />} />
                <Route path="/voicemail" element={<VoiceMail />} />
                <Route path="/contacts" element={<ContactComponent />} />
                <Route path="/chat" element={<ChatMessage />} />
                <Route path="/history" element={<HistoryComponent />} />
              </Route>
              {/* Catch-All Route for 404 */}
              <Route path="*" element={<Error />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
        <ToastContainerWrapper />
      </PersistGate>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
