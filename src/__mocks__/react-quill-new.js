const React = require('react');

function ReactQuill(props) {
  return React.createElement('textarea', {
    value: props.value || '',
    onChange: (e) => props.onChange && props.onChange(e.target.value),
    placeholder: props.placeholder,
    'data-testid': 'react-quill',
  });
}

module.exports = ReactQuill;
module.exports.default = ReactQuill;
