import React, { useRef } from 'react';
import JoditEditor from 'jodit-react';

const RichTextEditor = ({ value, onChange }) => {
  const editor = useRef(null);

  return (
    <JoditEditor
      ref={editor}
      value={value}
      tabIndex={1} // tabIndex of textarea
      onBlur={newContent => onChange(newContent)} // preferred to use only this option to update the content for performance reasons
      onChange={() => {}}
    />
  );
};

export default RichTextEditor;
