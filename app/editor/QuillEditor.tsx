'use client';

import { useEffect, useLayoutEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Quill, { Delta } from 'quill';
import type { EmitterSource } from 'quill';
import 'quill/dist/quill.snow.css';

type QuillModules = Record<string, unknown>;

export interface QuillEditorHandle {
  getEditor: () => Quill | null;
  getText: () => string;
  getHTML: () => string;
  setContents: (delta: Delta, source?: EmitterSource) => void;
  formatText: (
    index: number,
    length: number,
    format: string,
    value: unknown,
    source?: EmitterSource
  ) => void;
  replaceRange: (index: number, length: number, replacement: string) => void;
}

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  modules?: QuillModules;
  formats?: string[];
}

const QuillEditor = forwardRef<QuillEditorHandle, QuillEditorProps>(
  ({ value, onChange, placeholder = '여기에 글을 작성하세요...', modules, formats }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const isInitializedRef = useRef(false);
    const handleTextChangeRef = useRef<(() => void) | null>(null);

    // useLayoutEffect: DOM 마운트 직후 동기 실행이 필요 (Quill이 DOM 크기를 즉시 읽음)
    useLayoutEffect(() => {
      if (!editorRef.current) return;

      const existingToolbar = editorRef.current.querySelector('.ql-toolbar');
      const existingContainer = editorRef.current.querySelector('.ql-container');

      if (existingToolbar && existingContainer) {
        return;
      }

      if (isInitializedRef.current) {
        return;
      }

      editorRef.current.innerHTML = '';
      isInitializedRef.current = true;

      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        modules: modules || {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link'],
            ['clean']
          ],
        },
        formats: formats || [
          'header',
          'bold', 'italic', 'underline', 'strike',
          'color', 'background',
          'list',
          'link'
        ],
      });

      quillRef.current = quill;

      if (value) {
        quill.root.innerHTML = value;
      }

      const handleTextChange = () => {
        if (!quillRef.current) return;
        const html = quillRef.current.root.innerHTML;
        onChange(html);
      };
      
      handleTextChangeRef.current = handleTextChange;
      quill.on('text-change', handleTextChange);

      return () => {
        // React StrictMode에서 cleanup이 실행돼도 DOM 체크 + isInitializedRef로 재생성 방지
        if (quillRef.current && handleTextChangeRef.current) {
          try {
            quillRef.current.off('text-change', handleTextChangeRef.current);
          } catch {
            // Quill이 이미 destroy된 경우 무시
          }
        }
        quillRef.current = null;
        handleTextChangeRef.current = null;
        // isInitializedRef는 false로 되돌리지 않음 — StrictMode 이중 마운트 시 중복 생성 방지
      };
    }, []);

    useImperativeHandle(ref, () => ({
      getEditor: () => quillRef.current,
      getText: () => quillRef.current?.getText() || '',
      getHTML: () => quillRef.current?.root.innerHTML || '',
      setContents: (delta: Delta, source: EmitterSource = 'user') => {
        quillRef.current?.setContents(delta, source);
      },
      formatText: (
        index: number,
        length: number,
        format: string,
        value: unknown,
        source: EmitterSource = 'user'
      ) => {
        quillRef.current?.formatText(index, length, format, value, source);
      },
      replaceRange: (index: number, length: number, replacement: string) => {
        const quill = quillRef.current;
        if (!quill) return;
        quill.deleteText(index, length, 'user');
        quill.insertText(index, replacement, 'user');
      },
    }));

    useEffect(() => {
      if (quillRef.current && value !== quillRef.current.root.innerHTML) {
        const selection = quillRef.current.getSelection();
        quillRef.current.root.innerHTML = value;
        if (selection) {
          quillRef.current.setSelection(selection);
        }
      }
    }, [value]);

    return <div ref={editorRef} style={{ minHeight: '400px' }} className="bg-white" />;
  }
);

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;

