import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "../ConfigFirebase";
import { useAuth } from "../Auth/AuthContext";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../index.css";

interface Comment {
  id: string;
  text: string;
  userName: string;
  userProfile: string;
  createdAt: any;
  reactions?: string[];
  replies?: Comment[];
  images?: string;
}

interface CommentsListProps {
  sortBy: "latest" | "popular";
}

const formatTime = (date: Date | null) => {
  if (!date) return "Just now";

  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} min`;

  return "Just now";
};

const CommentsList: React.FC<CommentsListProps> = ({ sortBy }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyText, setReplyText] = useState<string>("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [parentCommentId, setParentCommentId] = useState<string | null>(null);
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 8;

  const [visibleComments, setVisibleComments] = useState<number>(1);
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;

  const currentComments = comments.slice(
    indexOfFirstComment,
    indexOfLastComment
  );

  const handlePageChange = (pageNumber: any) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(comments.length / commentsPerPage);

  useEffect(() => {
    const sortField = sortBy === "latest" ? "createdAt" : "reactions";
    const q = query(
      collection(db, "comments"),
      orderBy(sortField, sortBy === "latest" ? "desc" : "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let commentsData: Comment[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];

      if (sortBy === "popular") {
        commentsData = commentsData.sort(
          (a, b) => (b.reactions?.length || 0) - (a.reactions?.length || 0)
        );
      }

      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [sortBy]);

  const handleLikeToggle = async (commentId: string) => {
    if (user) {
      const userId = user.uid;
      const commentRef = doc(db, "comments", commentId);
      const commentSnap = await getDoc(commentRef);

      if (commentSnap.exists()) {
        const commentData = commentSnap.data() as Comment;

        if (commentData.reactions?.includes(userId)) {
          await updateDoc(commentRef, {
            reactions: arrayRemove(userId)
          });
        } else {
          await updateDoc(commentRef, {
            reactions: arrayUnion(userId)
          });
        }
      }
    } else {
      alert("Please sign in to like comments.");
    }
  };

  const handleReplyClick = (commentId: string, parentId: string | null) => {
    setReplyToCommentId(commentId);
    setParentCommentId(parentId);
  };

  const handleReplySubmit = async () => {
    if (replyToCommentId && user) {
      const commentRef = doc(db, "comments", replyToCommentId);
      const newReply: Comment = {
        id: new Date().toISOString(),
        text: replyText,
        userName: user.displayName || "Anonymous",
        userProfile: user.photoURL || "https://example.com/default-profile.png",
        createdAt: new Date(),
        reactions: [],
        replies: []
      };

      try {
        if (parentCommentId) {
          const parentCommentRef = doc(db, "comments", parentCommentId);
          const parentCommentSnap = await getDoc(parentCommentRef);

          if (parentCommentSnap.exists()) {
            const parentCommentData = parentCommentSnap.data() as Comment;

            if (parentCommentData.replies) {
              const updatedReplies = [...parentCommentData.replies, newReply];
              await updateDoc(parentCommentRef, { replies: updatedReplies });
            } else {
              await updateDoc(parentCommentRef, { replies: [newReply] });
            }
          }
        } else {
          await updateDoc(commentRef, {
            replies: arrayUnion(newReply)
          });
        }

        setReplyToCommentId(null);
        setParentCommentId(null);
        setReplyText("");
      } catch (error) {
        console.error("Error adding reply: ", error);
      }
    }
  };

  const renderTextWithStyles = (text: string) => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    return text.replace(mentionRegex, '<span style="color: blue;">@$1</span>');
  };

  const modifyHtmlContent = (html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const imageWrapper = document.createElement("div");
    const textWrapper = document.createElement("div");

    const imgElement = tempDiv.querySelector("img");
    if (imgElement) {
      imgElement.style.width = "10%";
      imageWrapper.appendChild(imgElement);
    }

    Array.from(tempDiv.childNodes).forEach((node) => {
      if (node !== imgElement) {
        textWrapper.appendChild(node);
      }
    });
    const finalDiv = document.createElement("div");
    finalDiv.appendChild(textWrapper);
    finalDiv.appendChild(imageWrapper);
    return finalDiv.innerHTML;
  };

  const [visibleReplies, setVisibleReplies] = useState<number>(1);

  const handleQuillChange = (value: string) => {
    setReplyText(value);
  };

  const renderReplies = (replies: Comment[], parentId: string | null) => {
    const handleLoadMoreReplies = () => {
      setVisibleReplies((prevCount) => prevCount + 2);
    };

    return (
      <div style={{ marginLeft: "20px" }}>
        {replies.slice(0, visibleReplies).map((reply) => (
          <div
            key={reply.id}
            style={{
              padding: "10px",
              marginTop: "10px",
              marginLeft: "70px",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={
                  reply.userProfile || "https://example.com/default-profile.png"
                }
                alt={reply.userName}
                style={{
                  borderRadius: "50%",
                  width: "15px",
                  height: "auto",
                  marginRight: "10px"
                }}
              />
              <div>
                <p style={{ margin: 0 }}>{reply.userName}</p>
              </div>
            </div>

            <div
              style={{ marginTop: "10px" }}
              dangerouslySetInnerHTML={{
                __html: renderTextWithStyles(modifyHtmlContent(reply.text))
              }}
            />
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <span
                style={{
                  border: "1px #b4adad solid",
                  borderRadius: "15px",
                  padding: "5px",
                  cursor: "pointer",
                  marginRight: "10px"
                }}
                onClick={() => handleLikeToggle(reply.id)}
              >
                {reply.reactions?.includes(user?.uid || "") ? (
                  <span style={{ color: "green" }}>👍</span>
                ) : (
                  <span>👍</span>
                )}{" "}
                {reply.reactions?.length || 0}
              </span>
              <button
                style={{
                  marginRight: "10px",
                  padding: "5px 10px",
                  background: "transparent",
                  border: "none"
                }}
                onClick={() => handleReplyClick(reply.id, parentId)}
              >
                Reply
              </button>
              <span>
                {reply.createdAt?.toDate
                  ? formatTime(reply.createdAt.toDate())
                  : "Just now"}
              </span>
            </div>
            {replyToCommentId === reply.id && (
              <div style={{ marginTop: "10px" }}>
                <ReactQuill
                  value={replyText}
                  onChange={handleQuillChange}
                  modules={{
                    toolbar: [
                      ["bold", "italic", "underline"],
                      ["link"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["image"]
                    ]
                  }}
                />
                <div style={{ display: "flex", justifyContent: "right" }}>
                  <button
                    style={{
                      marginTop: "10px",
                      padding: "5px 10px",
                      borderRadius: "4px"
                    }}
                    onClick={() => {
                      setReplyToCommentId(null);
                      setParentCommentId(null);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      marginTop: "10px",
                      padding: "5px 10px",
                      marginLeft: "10px",
                      backgroundColor: "black",
                      color: "white",
                      borderRadius: "4px"
                    }}
                    onClick={handleReplySubmit}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
            {reply.replies && renderReplies(reply.replies, reply.id)}
          </div>
        ))}
        {visibleReplies < replies.length && (
          <button
            onClick={handleLoadMoreReplies}
            style={{
              marginTop: "10px",
              padding: "5px 10px",
              background: "transparent",
              border: "none",
              color: "blue",
              cursor: "pointer"
            }}
          >
            Load more replies
          </button>
        )}
      </div>
    );
  };

  const handleLoadMoreComments = () => {
    setVisibleComments((prevCount) => prevCount + 2);
  };

  return (
    <div>
      {currentComments.map((comment) => (
        <div
          key={comment.id}
          style={{
            padding: "20px",
            marginTop: "10px",
            borderBottom: "1px solid #ddd"
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={
                comment.userProfile || "https://example.com/default-profile.png"
              }
              alt={comment.userName}
              style={{
                borderRadius: "50%",
                width: "30px",
                height: "auto",
                marginRight: "10px"
              }}
            />
            <div>
              <p style={{ margin: 0 }}>{comment.userName}</p>
            </div>
          </div>
          <div
            style={{ marginTop: "10px" }}
            dangerouslySetInnerHTML={{
              __html: renderTextWithStyles(modifyHtmlContent(comment.text))
            }}
          />
          <div
            style={{ marginTop: "10px", display: "flex", alignItems: "center" }}
          >
            <span
              style={{
                border: "1px #b4adad solid",
                borderRadius: "15px",
                padding: "5px",
                cursor: "pointer",
                marginRight: "10px"
              }}
              onClick={() => handleLikeToggle(comment.id)}
            >
              {comment.reactions?.includes(user?.uid || "") ? (
                <span style={{ color: "green" }}>👍</span>
              ) : (
                <span>👍</span>
              )}{" "}
              {comment.reactions?.length || 0}
            </span>
            <button
              style={{
                marginRight: "10px",
                padding: "5px 10px",
                background: "transparent",
                border: "none"
              }}
              onClick={() => handleReplyClick(comment.id, null)}
            >
              Reply
            </button>
            <span>
              {comment.createdAt?.toDate
                ? formatTime(comment.createdAt.toDate())
                : "Just now"}
            </span>
          </div>
          {replyToCommentId === comment.id && (
            <div style={{ marginTop: "10px" }}>
              <ReactQuill
                value={replyText}
                onChange={handleQuillChange}
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline"],
                    ["link"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["image"]
                  ]
                }}
              />
              <div style={{ display: "flex", justifyContent: "right" }}>
                <button
                  style={{
                    marginTop: "10px",
                    padding: "5px 10px",
                    borderRadius: "4px"
                  }}
                  onClick={() => {
                    setReplyToCommentId(null);
                    setParentCommentId(null);
                    setReplyText("");
                  }}
                >
                  Cancel
                </button>
                <button
                  style={{
                    marginTop: "10px",
                    padding: "5px 10px",
                    marginLeft: "10px",
                    backgroundColor: "black",
                    color: "white",
                    borderRadius: "4px"
                  }}
                  onClick={handleReplySubmit}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {comment.replies && renderReplies(comment.replies, comment.id)}
        </div>
      ))}
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
      >
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            style={{
              margin: "0 5px",
              padding: "5px 10px",
              background: currentPage === index + 1 ? "#ddd" : "transparent",
              border: "1px solid #ddd",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommentsList;
