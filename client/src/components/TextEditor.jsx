import React, { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import {io} from "socket.io-client"
import { useParams } from "react-router-dom";

//specifying our toolbar options
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];



const TextEditor = () => {
  const {id: documentId}= useParams()
  //connect and disconnect once
  const [socket,setSocket] = useState()
  const [quill,setQuill] = useState()

  useEffect(()=>{
    const s = io("https://google-docs-clone-9tsr.onrender.com")
    setSocket(s)
    return () =>{
      s.disconnect()
    }
  },[])

  //useEffect to create rooms according to the documentId from parameters
  useEffect(()=>{
    if(socket == null || quill == null) return 
    
    socket.once('load-document',document=>{
      quill.setContents(document) 
      quill.enable() 
    });
    socket.emit('get-document',documentId)
    
  },[socket,quill,documentId])

  
  //useEffect to save the document
  useEffect(()=>{
    if(socket==null || quill==null) return
    const interval = setInterval(()=>{ 
      const content = quill.getContents();
      console.log("Saving content:", content); // Log content to verify
      socket.emit('save-document',quill.getContents())
    },2000)
    return () =>{
      clearInterval(interval)
    }
  },[socket,quill])

  //useEffect to receive changes
  useEffect(()=>{
    if(socket==null || quill==null) return 

    socket.on('receive-changes', (delta) => {
      quill.updateContents(delta)
    });
    return () =>{
      socket.off('receive-changes',(delta) => {
        quill.updateContents(delta)
      })
    }
  },[socket,quill]);
  
  //useEffect to send changes
  useEffect(()=>{
    if(socket==null || quill==null) return 
    quill.on('text-change', (delta, oldDelta, source) => {
      if (source !== 'user') return
      socket.emit('send-changes',delta)
    });
    return () =>{
      quill.off('text-change',(delta, oldDelta, source) => {
        if (source !== 'user') return
        socket.emit('send-changes',delta)
      })
    }
  },[socket,quill])

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {theme: "snow", modules :{toolbar: TOOLBAR_OPTIONS }});
    q.disable()
    q.setText("Loading...") 
    setQuill(q)
  }, []);
  return <div className="container" ref={wrapperRef}></div>;
};

export default TextEditor;
