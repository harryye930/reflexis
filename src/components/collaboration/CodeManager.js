// This component has been unified with CodePalette into CodeManagement
// Import CodeManagement with mode="management"
import CodeManagement from './codePalette/CodeManagement.js';

const CodeManager = (props) => {
  return <CodeManagement {...props} mode="management" />;
};

export default CodeManager;
