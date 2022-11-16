const pName = "Louis";
let current_page = "home";

function Page() {
  return (
    <div>
      <Navbar />
      <Log_In />
    </div>
  );
}

class Navbar extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
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
            <div
              className="nav_item log_in_btn"
              id="log_in_btn"
              data-bs-toggle="modal"
              data-bs-target="#exampleModal"
            >
              Log in
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// function Navbar() {
//   return (
//     <div className="page_nav">
//       <div className="nav_ul">
//         <div className="nav_left">
//           <div>
//             <img src="./images/logo_icon.svg" className="navbar_logo" />
//           </div>
//           <div className="nav_item active" id="home_btn">
//             Home
//           </div>
//           <div className="nav_item" id="portal_btn">
//             Portal
//           </div>
//           <div className="nav_item" id="contact_btn">
//             Contact us
//           </div>
//         </div>
//         <div className="nav_right">
//           <div
//             className="nav_item log_in_btn"
//             id="log_in_btn"
//             data-bs-toggle="modal"
//             data-bs-target="#exampleModal"
//           >
//             Log in
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

function Log_In() {
  return (
    <div
      className="modal fade"
      id="exampleModal"
      tabIndex="-1"
      aria-labelledby="exampleModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel">
              Log in
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">...</div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button type="button" className="btn btn-primary">
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("main_body"));
root.render(<Page />);

window.addEventListener("click", () => {
  const home_btn = document.querySelector("#home_btn");
  home_btn.click();
});
