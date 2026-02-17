import DashboardLayout from "../layout/DashboardLayout";

const MyAccountPage = () => {
  return (
    <DashboardLayout>
      <div className="container-fluid px-3 px-md-4 py-4">
        <h4 className="fw-bold mb-4">My Account</h4>

        <div className="card shadow-sm border-0 p-4">
          <div className="row align-items-center gy-3 mb-4">
            <div className="col-12 col-md-3 text-center">
              <div className="position-relative d-inline-block">
                <img
                  src="https://i.pravatar.cc/120"
                  className="rounded-circle"
                />
                <span className="position-absolute bottom-0 end-0 bg-danger rounded-circle p-2">
                  <i className="bi bi-trash text-white small" />
                </span>
              </div>
            </div>

            <div className="col-12 col-md-9">
              <div className="fw-semibold">Upload Profile Picture</div>
              <div className="text-muted small mb-2">
                Image should be of JPG or PNG format only
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm px-4">
                  Upload
                </button>
                <button className="btn btn-warning btn-sm px-4 fw-semibold">
                  Edit
                </button>
              </div>
            </div>
          </div>

          <hr />

          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label className="form-label small">Name</label>
              <input className="form-control" value="Ganesh" />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Phone Number</label>
              <input className="form-control" value="+91 9123456780" />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Role</label>
              <input className="form-control bg-light" value="Super Admin" disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Email ID</label>
              <input className="form-control bg-light" value="admin@bistrobill.com" disabled />
            </div>
          </div>

          <div className="text-end mt-4">
            <button className="btn btn-dark px-4">Save Changes</button>
          </div>
        </div>
      </div>
      {/* <div className="container-fluid px-3 px-md-4 py-4">
        <h4 className="fw-bold mb-4">My Account</h4>

        <div className="card shadow-sm border-0 p-4">
          <div className="row align-items-center gy-3 mb-4">
            <div className="col-12 col-md-3 text-center">
              <div className="position-relative d-inline-block">
                <img
                  src="https://i.pravatar.cc/120"
                  className="rounded-circle"
                />
                <span className="position-absolute bottom-0 end-0 bg-danger rounded-circle p-2">
                  <i className="bi bi-trash text-white small" />
                </span>
              </div>
            </div>

            <div className="col-12 col-md-9">
              <div className="fw-semibold">Upload Profile Picture</div>
              <div className="text-muted small mb-2">
                Image should be of JPG or PNG format only
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm px-4">
                  Upload
                </button>
                <button className="btn btn-warning btn-sm px-4 fw-semibold">
                  Edit
                </button>
              </div>
            </div>
          </div>

          <hr />

          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label className="form-label small">Name</label>
              <input className="form-control" value="Ganesh" />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Phone Number</label>
              <input className="form-control" value="+91 9123456780" />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Role</label>
              <input className="form-control bg-light" value="Super Admin" disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label small">Email ID</label>
              <input className="form-control bg-light" value="admin@bistrobill.com" disabled />
            </div>
          </div>

          <div className="text-end mt-4">
            <button className="btn btn-dark px-4">Save Changes</button>
          </div>
        </div>
      </div> */}
    </DashboardLayout>
  );
};

export default MyAccountPage;
