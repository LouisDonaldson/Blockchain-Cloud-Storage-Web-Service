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
    <div className="page_nav">
      <ul className="nav_ul">
        <li>
          <img src="./images/logo_icon.svg" className="navbar_logo" />
        </li>
        <li className="nav_item active">Home</li>
        <li className="nav_item">Portal</li>
        <li className="nav_item">Contact us</li>
      </ul>
    </div>

  );
}

const root = ReactDOM.createRoot(document.getElementById("main_body"));
root.render(<Page />);
