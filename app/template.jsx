// Unlike layout.jsx, template.jsx creates a fresh instance on every real
// navigation (About -> Contact -> Login, etc.), which is exactly what's
// needed to retrigger this animation each time. The quiz screens inside
// the homepage use a different mechanism (a key-based remount), since
// those are React state changes within one page, not actual navigations
// -- this covers the other half: moving between genuinely different pages.
export default function Template({ children }) {
  return <div className="ar-page-transition">{children}</div>;
}
