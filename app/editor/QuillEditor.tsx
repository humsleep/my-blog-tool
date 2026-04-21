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

    // useLayoutEffect를 사용하여 DOM 업데이트 전에 동기적으로 실행
    useLayoutEffect(() => {
      if (!editorRef.current) return;

      // DOM에 이미 Quill이 있는지 확인 (가장 확실한 방법)
      const existingToolbar = editorRef.current.querySelector('.ql-toolbar');
      const existingContainer = editorRef.current.querySelector('.ql-container');
      
      // 이미 Quill이 초기화되어 있으면 생성하지 않음
      if (existingToolbar && existingContainer) {
        return;
      }

      // 이미 초기화 플래그가 설정되어 있으면 생성하지 않음
      if (isInitializedRef.current) {
        return;
      }

      // 컨테이너 완전히 비우기
      editorRef.current.innerHTML = '';

      // 마킹: 초기화 시작
      isInitializedRef.current = true;

      // Quill 인스턴스 생성
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

      // 초기 값 설정
      if (value) {
        quill.root.innerHTML = value;
      }

      // 텍스트 변경 이벤트 리스너
      const handleTextChange = () => {
        if (!quillRef.current) return;
        const html = quillRef.current.root.innerHTML;
        onChange(html);
      };
      
      handleTextChangeRef.current = handleTextChange;
      quill.on('text-change', handleTextChange);

      return () => {
        // cleanup: React StrictMode에서 실행될 수 있지만,
        // DOM 체크와 isInitializedRef로 인해 재생성되지 않음
        if (quillRef.current && handleTextChangeRef.current) {
          try {
            quillRef.current.off('text-change', handleTextChangeRef.current);
          } catch (e) {
            // 무시
          }
        }
        // cleanup에서는 인스턴스만 null로 설정하고, isInitializedRef는 유지
        quillRef.current = null;
        handleTextChangeRef.current = null;
        // isInitializedRef.current는 false로 설정하지 않음 (중복 생성 방지)
      };
    }, []); // 한 번만 실행

    // 외부에서 Quill 인스턴스에 접근할 수 있도록 ref 노출
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

    // value prop이 변경되면 에디터 업데이트 (외부에서 변경된 경우)
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

