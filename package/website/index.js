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
      <div className="nav_ul">
        <div className="nav_left">
          <div>
            <img src="./images/logo_icon.svg" className="navbar_logo" />
          </div>
          <div className="nav_item active" id="home_btn">
            Home
          </div>
          <div className="nav_item" id="portal_btn">
            Portal
          </div>
          <div className="nav_item" id="contact_btn">
            Contact us
          </div>
        </div>
        <div className="nav_right">
          <div className="nav_item log_in_btn" id="log_in_btn">
            Log in
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("main_body"));
root.render(<Page />);
