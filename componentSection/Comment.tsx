import React, { useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "../Auth/AuthContext";
import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query,
  getDocs
} from "firebase/firestore";
import { db } from "../ConfigFirebase";
import "./Comment.css";

interface Comment {
  id: string;
  text: string;
  userName: string;
  userProfile: string;
  createdAt: any;
  likes: number;
  replies: any[];
  images: string;
}

interface CommentBoxProps {
  handleCommentCount: (count: number) => void;
}

const CommentBox: React.FC<CommentBoxProps> = ({ handleCommentCount }) => {
  const [content, setContent] = useState<string>("");
  const [userSuggestions, setUserSuggestions] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const { user } = useAuth();
  const quillRef = useRef<ReactQuill | null>(null);

  const fetchUsers = async () => {
    try {
      const userCollection = collection(db, "comments");
      const userSnapshot = await getDocs(userCollection);
      const userList = userSnapshot.docs.map(
        (doc) => doc.data().userName
      ) as string[];
      const uniqueUsers = Array.from(new Set(userList));
      setAllUsers(uniqueUsers);
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUserSuggestions = (input: string) => {
    input = input.replace(/<nan<\/p>/g, "").replace(/<\/p>/g, "");
    const suggestions = allUsers
      .filter((user) => user.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 5);
    setUserSuggestions(Array.from(new Set(suggestions)));
  };

  const handleSubmit = async () => {
    if (content.trim().length > 0 && user) {
      try {
        await addDoc(collection(db, "comments"), {
          text: content,
          userName: user.displayName || "Anonymous",
          userProfile: user.photoURL || "",
          createdAt: serverTimestamp(),
          likes: 0,
          replies: []
        });
        setContent("");
      } catch (error) {
        console.error("Error adding comment: ", error);
      }
    } else {
      alert(`Please check your message. Length: ${content.trim().length}`);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      handleCommentCount(snapshot?.docs?.length);
      snapshot.docs.map((doc) => doc.data());
    });

    return () => unsubscribe();
  }, []);

  const handleQuillChange = (value: string) => {
    setContent(value);

    if (value.includes("@")) {
      const query = value.split("@").pop()?.toLowerCase() || "";
      fetchUserSuggestions(query);
    } else {
      setUserSuggestions([]);
    }
  };

  useEffect(() => {
    const resizeImages = () => {
      const editor = quillRef.current?.getEditor();
      const images = editor?.root.querySelectorAll("img") || [];
      images.forEach((img) => {
        img.style.width = "10%";
      });
    };

    resizeImages();
  }, [content]);

  const handleSuggestionClick = (username: string) => {
    const cursorPosition =
      quillRef.current?.getEditor().getSelection()?.index || 0;
    const currentContent = quillRef.current?.getEditor().getText() || "";
    const beforeCursor = currentContent.slice(0, cursorPosition);
    const afterCursor = currentContent.slice(cursorPosition);

    const styledUsername = `<span style="color: blue;">@${username}</span>`;
    const textData = beforeCursor + styledUsername + afterCursor;
    setContent(textData);

    setUserSuggestions([]);
  };

  return (
    <div className="comment-box-container" style={{ backgroundColor: "unset" }}>
      {user ? (
        <div>
          <ReactQuill
            ref={quillRef}
            value={content}
            onChange={handleQuillChange}
            theme="snow"
            modules={{
              toolbar: [
                ["bold", "italic", "underline"],
                [{ list: "bullet" }],
                ["image"]
              ]
            }}
            formats={["bold", "italic", "underline", "list", "bullet", "image"]}
            placeholder="Write a comment..."
          />
          <div className="comment-box-footer">
            <button className="send-button" onClick={handleSubmit}>
              Send
            </button>
          </div>

          {userSuggestions.length > 0 && (
            <div className="suggestions-list">
              {userSuggestions.map((username, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(username)}
                  style={{ color: "blue" }}
                >
                  {username}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p>Please sign in to comment.</p>
      )}
    </div>
  );
};

export default CommentBox;
