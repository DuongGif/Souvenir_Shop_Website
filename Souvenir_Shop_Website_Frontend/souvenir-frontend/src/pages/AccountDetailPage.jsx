import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { accountService } from "../services/accountService";
import { vnAddressData } from "../data/vnAddressData";

const emptyAddress = {
  recipientName: "",
  recipientPhone: "",
  addressLine1: "",
  addressLine2: "",
  ward: "",
  district: "",
  province: "",
  country: "VN",
  postalCode: "",
  isDefault: false,
};

const labelStyle = { color: "#111827", fontWeight: 600 };
const inputStyle = {
  height: 46,
  borderRadius: 12,
  color: "#111827",
  backgroundColor: "#fff",
};

export default function AccountDetailPage() {
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
  });

  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [profileMsg, setProfileMsg] = useState("");
  const [addressMsg, setAddressMsg] = useState("");
  const [err, setErr] = useState("");

  const provinceOptions = vnAddressData.map((item) => item.province);

  const selectedProvince = vnAddressData.find(
    (item) => item.province === addressForm.province
  );

  const districtOptions = selectedProvince
    ? selectedProvince.districts.map((d) => d.name)
    : [];

  const selectedDistrict = selectedProvince?.districts.find(
    (d) => d.name === addressForm.district
  );

  const wardOptions = selectedDistrict ? selectedDistrict.wards : [];

  const loadData = async () => {
    setLoading(true);
    setErr("");

    try {
      const [meRes, addressesRes] = await Promise.all([
        accountService.getMe(),
        accountService.getAddresses(),
      ]);

      setProfile(meRes.data);
      setProfileForm({
        fullName: meRes.data.fullName || "",
        phone: meRes.data.phone || "",
      });
      setAddresses(addressesRes.data || []);
    } catch (ex) {
      setErr(ex?.response?.data ?? "Không thể tải thông tin tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setAddressForm({
        ...addressForm,
        [name]: checked,
      });
      return;
    }

    if (name === "province") {
      setAddressForm({
        ...addressForm,
        province: value,
        district: "",
        ward: "",
      });
      return;
    }

    if (name === "district") {
      setAddressForm({
        ...addressForm,
        district: value,
        ward: "",
      });
      return;
    }

    setAddressForm({
      ...addressForm,
      [name]: value,
    });
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    setErr("");

    try {
      await accountService.updateMe({
        fullName: profileForm.fullName,
        phone: profileForm.phone,
      });
      setProfileMsg("Cập nhật thông tin cá nhân thành công");
      await loadData();
    } catch (ex) {
      setErr(ex?.response?.data ?? "Cập nhật thông tin thất bại");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressMsg("");
    setErr("");

    try {
      if (editingAddressId) {
        await accountService.updateAddress(editingAddressId, addressForm);
        setAddressMsg("Cập nhật địa chỉ thành công");
      } else {
        await accountService.createAddress(addressForm);
        setAddressMsg("Thêm địa chỉ thành công");
      }

      setAddressForm(emptyAddress);
      setEditingAddressId(null);
      await loadData();
    } catch (ex) {
      setErr(ex?.response?.data ?? "Lưu địa chỉ thất bại");
    } finally {
      setSavingAddress(false);
    }
  };

  const startEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      recipientName: addr.recipientName || "",
      recipientPhone: addr.recipientPhone || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      ward: addr.ward || "",
      district: addr.district || "",
      province: addr.province || "",
      country: addr.country || "VN",
      postalCode: addr.postalCode || "",
      isDefault: !!addr.isDefault,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditAddress = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;

    try {
      await accountService.deleteAddress(id);
      await loadData();
    } catch (ex) {
      setErr(ex?.response?.data ?? "Xóa địa chỉ thất bại");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await accountService.setDefaultAddress(id);
      await loadData();
    } catch (ex) {
      setErr(ex?.response?.data ?? "Không thể đặt địa chỉ mặc định");
    }
  };

  return (
    <MainLayout>
      <section className="section">
        <div className="container" data-aos="fade-up">
          <div className="section-title">
            <h2>Tài khoản của tôi</h2>
            <p>
              Xem và cập nhật thông tin cá nhân, đồng thời quản lý danh sách địa
              chỉ nhận hàng của bạn.
            </p>
          </div>

          {err && (
            <div className="alert alert-danger" role="alert">
              {String(err)}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status"></div>
              <p className="mt-3 mb-0">Đang tải thông tin tài khoản...</p>
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-5">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 24,
                    padding: 28,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                  }}
                >
                  <h4 style={{ color: "#1f2937", fontWeight: 700 }}>
                    Thông tin cá nhân
                  </h4>

                  {profileMsg && (
                    <div className="alert alert-success mt-3" role="alert">
                      {profileMsg}
                    </div>
                  )}

                  <div
                    className="mt-3 mb-4"
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: "#f8fafc",
                      color: "#475569",
                    }}
                  >
                    <div>
                      <strong>Email:</strong> {profile?.email}
                    </div>
                    <div>
                      <strong>Vai trò:</strong> {profile?.role}
                    </div>
                    <div>
                      <strong>Trạng thái:</strong> {profile?.status}
                    </div>
                  </div>

                  <form onSubmit={submitProfile}>
                    <div className="mb-3">
                      <label className="form-label" style={labelStyle}>
                        Họ và tên
                      </label>
                      <input
                        name="fullName"
                        className="form-control"
                        value={profileForm.fullName}
                        onChange={handleProfileChange}
                        style={{ ...inputStyle, height: 48 }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={labelStyle}>
                        Số điện thoại
                      </label>
                      <input
                        name="phone"
                        className="form-control"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        style={{ ...inputStyle, height: 48 }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={savingProfile}
                      style={{ height: 48, borderRadius: 12, fontWeight: 600 }}
                    >
                      {savingProfile
                        ? "Đang cập nhật..."
                        : "Lưu thông tin cá nhân"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-lg-7">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 24,
                    padding: 28,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    marginBottom: 24,
                  }}
                >
                  <h4 style={{ color: "#1f2937", fontWeight: 700 }}>
                    {editingAddressId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                  </h4>

                  {addressMsg && (
                    <div className="alert alert-success mt-3" role="alert">
                      {addressMsg}
                    </div>
                  )}

                  <form className="mt-3" onSubmit={submitAddress}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" style={labelStyle}>
                          Tên người nhận
                        </label>
                        <input
                          name="recipientName"
                          className="form-control"
                          value={addressForm.recipientName}
                          onChange={handleAddressChange}
                          style={inputStyle}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label" style={labelStyle}>
                          SĐT người nhận
                        </label>
                        <input
                          name="recipientPhone"
                          className="form-control"
                          value={addressForm.recipientPhone}
                          onChange={handleAddressChange}
                          style={inputStyle}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label" style={labelStyle}>
                          Địa chỉ dòng 1
                        </label>
                        <input
                          name="addressLine1"
                          className="form-control"
                          value={addressForm.addressLine1}
                          onChange={handleAddressChange}
                          style={inputStyle}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label" style={labelStyle}>
                          Địa chỉ dòng 2
                        </label>
                        <input
                          name="addressLine2"
                          className="form-control"
                          value={addressForm.addressLine2}
                          onChange={handleAddressChange}
                          style={inputStyle}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" style={labelStyle}>
                          Tỉnh/Thành phố
                        </label>
                        <select
                          name="province"
                          className="form-select"
                          value={addressForm.province}
                          onChange={handleAddressChange}
                          style={inputStyle}
                        >
                          <option value="">Chọn tỉnh/thành phố</option>
                          {provinceOptions.map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" style={labelStyle}>
                          Quận/Huyện
                        </label>
                        <select
                          name="district"
                          className="form-select"
                          value={addressForm.district}
                          onChange={handleAddressChange}
                          style={inputStyle}
                          disabled={!addressForm.province}
                        >
                          <option value="">Chọn quận/huyện</option>
                          {districtOptions.map((district) => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" style={labelStyle}>
                          Phường/Xã
                        </label>
                        <select
                          name="ward"
                          className="form-select"
                          value={addressForm.ward}
                          onChange={handleAddressChange}
                          style={inputStyle}
                          disabled={!addressForm.district}
                        >
                          <option value="">Chọn phường/xã</option>
                          {wardOptions.map((ward) => (
                            <option key={ward} value={ward}>
                              {ward}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label" style={labelStyle}>
                          Quốc gia
                        </label>
                        <input
                          name="country"
                          className="form-control"
                          value={addressForm.country}
                          onChange={handleAddressChange}
                          style={inputStyle}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label" style={labelStyle}>
                          Mã bưu chính
                        </label>
                        <input
                          name="postalCode"
                          className="form-control"
                          value={addressForm.postalCode}
                          onChange={handleAddressChange}
                          style={inputStyle}
                        />
                      </div>

                      <div className="col-12">
                        <div className="form-check mt-2">
                          <input
                            id="isDefault"
                            name="isDefault"
                            type="checkbox"
                            className="form-check-input"
                            checked={addressForm.isDefault}
                            onChange={handleAddressChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="isDefault"
                            style={{ color: "#111827", fontWeight: 500 }}
                          >
                            Đặt làm địa chỉ mặc định
                          </label>
                        </div>
                      </div>

                      <div className="col-12 d-flex gap-2">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={savingAddress}
                          style={{ borderRadius: 12, minWidth: 160 }}
                        >
                          {savingAddress
                            ? "Đang lưu..."
                            : editingAddressId
                            ? "Cập nhật địa chỉ"
                            : "Thêm địa chỉ"}
                        </button>

                        {editingAddressId && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            style={{ borderRadius: 12 }}
                            onClick={cancelEditAddress}
                          >
                            Hủy chỉnh sửa
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>

                <div
                  style={{
                    background: "#fff",
                    borderRadius: 24,
                    padding: 28,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                  }}
                >
                  <h4 style={{ color: "#1f2937", fontWeight: 700 }}>
                    Danh sách địa chỉ
                  </h4>

                  {addresses.length === 0 ? (
                    <p className="mt-3 mb-0" style={{ color: "#64748b" }}>
                      Bạn chưa có địa chỉ nào.
                    </p>
                  ) : (
                    <div className="mt-3 d-grid gap-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 18,
                            padding: 18,
                            background: addr.isDefault ? "#f8fbff" : "#fff",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                            <div>
                              <h6
                                style={{
                                  marginBottom: 6,
                                  color: "#1f2937",
                                  fontWeight: 700,
                                }}
                              >
                                {addr.recipientName}
                                {addr.isDefault && (
                                  <span
                                    style={{
                                      marginLeft: 10,
                                      background: "#198754",
                                      color: "#fff",
                                      fontSize: 12,
                                      padding: "4px 8px",
                                      borderRadius: 999,
                                    }}
                                  >
                                    Mặc định
                                  </span>
                                )}
                              </h6>

                              <div style={{ color: "#475569" }}>
                                {addr.recipientPhone}
                              </div>
                              <div style={{ color: "#475569" }}>
                                {[
                                  addr.addressLine1,
                                  addr.addressLine2,
                                  addr.ward,
                                  addr.district,
                                  addr.province,
                                  addr.country,
                                  addr.postalCode,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            </div>

                            <div className="d-flex gap-2 flex-wrap">
                              {!addr.isDefault && (
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  style={{ borderRadius: 10 }}
                                  onClick={() => handleSetDefault(addr.id)}
                                >
                                  Đặt mặc định
                                </button>
                              )}

                              <button
                                className="btn btn-sm btn-outline-primary"
                                style={{ borderRadius: 10 }}
                                onClick={() => startEditAddress(addr)}
                              >
                                Sửa
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger"
                                style={{ borderRadius: 10 }}
                                onClick={() => handleDeleteAddress(addr.id)}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}