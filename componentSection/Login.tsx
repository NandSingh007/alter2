import React from "react";
import { useAuth } from "../Auth/AuthContext";
import "../App.css";
import logo from "../image/Google logo.png";

const Login: React.FC = () => {
  const authContext = useAuth();

  if (!authContext) {
    return null;
  }

  const { user, signIn, logout } = authContext;

  return (
    <div className="login-container">
      <div className="login-content">
        {!user ? (
          <button
            style={{
              background: "transparent",
              border: "none",
              display: "flex",
              alignItems: "center"
            }}
            onClick={signIn}
          >
            <img
              src={logo}
              alt="Google logo"
              style={{ width: "24px", height: "24px", marginRight: "8px" }}
            />
            Sign In with Google
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%"
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={user.photoURL || ""}
                alt={user.displayName || "User"}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  marginRight: "10px"
                }}
              />
              <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
                {user.displayName || "User"}
              </h2>
            </div>
            <div>
              <button
                style={{
                  padding: "8px 16px",
                  cursor: "pointer",
                  background: "transparent",
                  border: "none"
                }}
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
