const pName = "Louis";

function Page() {
  return (
    <div>
      <Navbar />
    </div>
  );
}

function Navbar() {
  return (
    <nav className="navbar navbar-expand-sm  navbar-light page_nav">
      <div className="container-fluid">
        <ul className="navbar-nav">
          <a className="navbar-brand" href="#">
            <img src="./images/logo.svg" alt="" />
          </a>
          <li className="nav-item">
            <a className="nav-link active" href="#">
              Home
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Portal
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Contact us
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

const root = ReactDOM.createRoot(document.getElementById("main_body"));
root.render(<Page />);
