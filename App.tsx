import React, { useState } from "react";
import { AuthProvider } from "./Auth/AuthContext";
import Login from "./componentSection/Login";
import CommentList from "./componentSection/CommentList";
import CommentBox from "./componentSection/Comment";
import "./index.css";

const App: React.FC = () => {
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [commentCount, setCommentCount] = useState<number>(0);

  const handleCommentCount = (count: number) => {
    setCommentCount(count);
  };

  return (
    <AuthProvider>
      <div
        className="App"
        style={{
          backgroundColor: "GrayText",
          color: "teal",
          fontSize: "1rem",
          fontFamily: "cursive"
        }}
      >
        <main>
          <Login />

          <div className="app-box-container">
            <div
              style={{
                marginBottom: "10px",
                display: "flex",
                justifyContent: "space-between",
                backgroundColor: "violet",
                color: "black"
              }}
            >
              <div>
                <b>Comments({commentCount})</b>
              </div>
              <div>
                <button
                  style={{
                    border: "none",
                    padding: "5px 10px",
                    background: sortBy === "latest" ? "#ddd" : "transparent"
                  }}
                  onClick={() => setSortBy("latest")}
                >
                  Latest
                </button>
                <button
                  style={{
                    padding: "5px 10px",
                    border: "none",
                    background: sortBy === "popular" ? "#ddd" : "transparent"
                  }}
                  onClick={() => setSortBy("popular")}
                >
                  Popular
                </button>
              </div>
            </div>
            <CommentBox handleCommentCount={handleCommentCount} />
            <CommentList sortBy={sortBy} />
          </div>
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;
