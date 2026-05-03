import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { accountService } from "../services/accountService";
import { vnAddressData } from "../data/vnAddressData";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { commonTranslations } from "../i18n/common";

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

const pageCard = {
  background: "#ffffff",
  borderRadius: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const labelStyle = {
  color: "#111827",
  fontWeight: 700,
  marginBottom: 8,
  fontSize: 14,
};

const inputStyle = {
  height: 44,
  borderRadius: 10,
  color: "#111827",
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  boxShadow: "none",
};

const getErrorMessage = (ex, fallback) => {
  const data = ex?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors) {
    const firstError = Object.values(data.errors)?.flat?.()[0];
    if (firstError) return firstError;
  }
  return fallback;
};

export default function AccountDetailPage() {
  const { language } = useLanguage();
  const t = commonTranslations?.[language] || commonTranslations?.vi || {};

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
      setErr(
        getErrorMessage(
          ex,
          t.accountLoadFailed || "Không thể tải thông tin tài khoản"
        )
      );
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
      setProfileMsg(
        t.accountProfileUpdated || "Cập nhật thông tin cá nhân thành công"
      );
      await loadData();
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          t.accountProfileUpdateFailed || "Cập nhật thông tin thất bại"
        )
      );
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
        setAddressMsg(
          t.accountAddressUpdated || "Cập nhật địa chỉ thành công"
        );
      } else {
        await accountService.createAddress(addressForm);
        setAddressMsg(t.accountAddressAdded || "Thêm địa chỉ thành công");
      }

      setAddressForm(emptyAddress);
      setEditingAddressId(null);
      await loadData();
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          t.accountAddressSaveFailed || "Lưu địa chỉ thất bại"
        )
      );
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
    if (!window.confirm(t.accountDeleteAddressConfirm || "Bạn có chắc muốn xóa địa chỉ này?")) {
      return;
    }

    try {
      await accountService.deleteAddress(id);
      await loadData();
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          t.accountDeleteAddressFailed || "Xóa địa chỉ thất bại"
        )
      );
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await accountService.setDefaultAddress(id);
      await loadData();
    } catch (ex) {
      setErr(
        getErrorMessage(
          ex,
          t.accountSetDefaultFailed || "Không thể đặt địa chỉ mặc định"
        )
      );
    }
  };

  return (
    <MainLayout>
      <section
        className="section"
        style={{
          background: "#f5f5f5",
          minHeight: "100vh",
          paddingTop: 32,
          paddingBottom: 48,
        }}
      >
        <div className="container">
          <div
            style={{
              ...pageCard,
              padding: 24,
              marginBottom: 20,
              borderLeft: "5px solid #ee4d2d",
            }}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  {t.accountHeaderSmall || "Tài khoản SouVN"}
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "#111827",
                    fontSize: "clamp(24px, 4vw, 34px)",
                  }}
                >
                  {t.accountHeaderTitle || "Tài khoản của tôi"}
                </h2>
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  fontWeight: 600,
                }}
              >
                {t.accountAddressCount || "Số địa chỉ:"}{" "}
                <span style={{ color: "#ee4d2d" }}>{addresses.length}</span>
              </div>
            </div>
          </div>

          {err && (
            <div
              className="alert mb-4"
              role="alert"
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: 12,
              }}
            >
              {String(err)}
            </div>
          )}

          {loading ? (
            <div style={{ ...pageCard, padding: 40 }} className="text-center">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-3 mb-0" style={{ color: "#6b7280" }}>
                {t.accountLoading || "Đang tải thông tin tài khoản..."}
              </p>
            </div>
          ) : (
            <div className="row g-4 align-items-start">
              <div className="col-lg-5">
                <div style={{ ...pageCard, padding: 24 }}>
                  <h4
                    style={{
                      color: "#111827",
                      fontWeight: 800,
                      marginBottom: 18,
                    }}
                  >
                    {t.accountPersonalInfo || "Thông tin cá nhân"}
                  </h4>

                  {profileMsg && (
                    <div
                      className="alert mb-3"
                      role="alert"
                      style={{
                        background: "#ecfdf5",
                        color: "#047857",
                        border: "1px solid #a7f3d0",
                        borderRadius: 12,
                      }}
                    >
                      {profileMsg}
                    </div>
                  )}

                  <div
                    className="mb-4"
                    style={{
                      background: "#fafafa",
                      borderRadius: 14,
                      padding: 16,
                      color: "#4b5563",
                      lineHeight: 1.8,
                    }}
                  >
                    <div>
                      <strong style={{ color: "#111827" }}>
                        {t.emailLabel || "Email:"}
                      </strong>{" "}
                      {profile?.email || "-"}
                    </div>
                    <div>
                      <strong style={{ color: "#111827" }}>
                        {t.accountRoleLabel || "Vai trò:"}
                      </strong>{" "}
                      {profile?.role || "-"}
                    </div>
                    <div>
                      <strong style={{ color: "#111827" }}>
                        {t.accountStatusLabel || "Trạng thái:"}
                      </strong>{" "}
                      {profile?.status || "-"}
                    </div>
                  </div>

                  <form onSubmit={submitProfile}>
                    <div className="mb-3">
                      <label className="form-label" style={labelStyle}>
                        {t.fullNameLabel || "Họ và tên"}
                      </label>
                      <input
                        name="fullName"
                        className="form-control"
                        value={profileForm.fullName}
                        onChange={handleProfileChange}
                        style={inputStyle}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={labelStyle}>
                        {t.phoneLabel || "Số điện thoại"}
                      </label>
                      <input
                        name="phone"
                        className="form-control"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        style={inputStyle}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      style={{
                        width: "100%",
                        height: 46,
                        borderRadius: 10,
                        border: "none",
                        background: "#ee4d2d",
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      {savingProfile
                        ? t.accountUpdating || "Đang cập nhật..."
                        : t.accountSaveProfile || "Lưu thông tin cá nhân"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-lg-7">
                <div
                  style={{
                    ...pageCard,
                    padding: 24,
                    marginBottom: 18,
                  }}
                >
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                    <h4
                      style={{
                        color: "#111827",
                        fontWeight: 800,
                        margin: 0,
                      }}
                    >
                      {editingAddressId
                        ? t.accountEditAddressTitle || "Chỉnh sửa địa chỉ"
                        : t.accountAddAddressTitle || "Thêm địa chỉ mới"}
                    </h4>

                    {editingAddressId && (
                      <span
                        style={{
                          background: "#fff7ed",
                          color: "#c2410c",
                          borderRadius: 999,
                          padding: "6px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {t.accountEditingBadge || "Đang chỉnh sửa"}
                      </span>
                    )}
                  </div>

                  {addressMsg && (
                    <div
                      className="alert mb-3"
                      role="alert"
                      style={{
                        background: "#ecfdf5",
                        color: "#047857",
                        border: "1px solid #a7f3d0",
                        borderRadius: 12,
                      }}
                    >
                      {addressMsg}
                    </div>
                  )}

                  <form onSubmit={submitAddress}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" style={labelStyle}>
                          {t.accountRecipientName || "Tên người nhận"}
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
                          {t.accountRecipientPhone || "SĐT người nhận"}
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
                          {t.accountAddressLine1 || "Địa chỉ dòng 1"}
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
                          {t.accountAddressLine2 || "Địa chỉ dòng 2"}
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
                          {t.accountProvince || "Tỉnh/Thành phố"}
                        </label>
                        <select
                          name="province"
                          className="form-select"
                          value={addressForm.province}
                          onChange={handleAddressChange}
                          style={inputStyle}
                        >
                          <option value="">
                            {t.accountChooseProvince || "Chọn tỉnh/thành phố"}
                          </option>
                          {provinceOptions.map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" style={labelStyle}>
                          {t.accountDistrict || "Quận/Huyện"}
                        </label>
                        <select
                          name="district"
                          className="form-select"
                          value={addressForm.district}
                          onChange={handleAddressChange}
                          style={inputStyle}
                          disabled={!addressForm.province}
                        >
                          <option value="">
                            {t.accountChooseDistrict || "Chọn quận/huyện"}
                          </option>
                          {districtOptions.map((district) => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label" style={labelStyle}>
                          {t.accountWard || "Phường/Xã"}
                        </label>
                        <select
                          name="ward"
                          className="form-select"
                          value={addressForm.ward}
                          onChange={handleAddressChange}
                          style={inputStyle}
                          disabled={!addressForm.district}
                        >
                          <option value="">
                            {t.accountChooseWard || "Chọn phường/xã"}
                          </option>
                          {wardOptions.map((ward) => (
                            <option key={ward} value={ward}>
                              {ward}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label" style={labelStyle}>
                          {t.accountCountry || "Quốc gia"}
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
                          {t.accountPostalCode || "Mã bưu chính"}
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
                        <div
                          className="form-check"
                          style={{
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                            borderRadius: 12,
                            padding: "12px 14px 12px 38px",
                          }}
                        >
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
                            style={{ color: "#9a3412", fontWeight: 600 }}
                          >
                            {t.accountSetDefaultCheckbox ||
                              "Đặt làm địa chỉ mặc định"}
                          </label>
                        </div>
                      </div>

                      <div className="col-12 d-flex gap-2 flex-wrap">
                        <button
                          type="submit"
                          disabled={savingAddress}
                          style={{
                            minWidth: 160,
                            height: 44,
                            borderRadius: 10,
                            border: "none",
                            background: "#ee4d2d",
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        >
                          {savingAddress
                            ? t.accountSaving || "Đang lưu..."
                            : editingAddressId
                            ? t.accountUpdateAddressButton || "Cập nhật địa chỉ"
                            : t.accountAddAddressButton || "Thêm địa chỉ"}
                        </button>

                        {editingAddressId && (
                          <button
                            type="button"
                            onClick={cancelEditAddress}
                            style={{
                              minWidth: 130,
                              height: 44,
                              borderRadius: 10,
                              border: "1px solid #d1d5db",
                              background: "#fff",
                              color: "#374151",
                              fontWeight: 700,
                            }}
                          >
                            {t.accountCancelEdit || "Hủy chỉnh sửa"}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>

                <div style={{ ...pageCard, padding: 24 }}>
                  <h4
                    style={{
                      color: "#111827",
                      fontWeight: 800,
                      marginBottom: 18,
                    }}
                  >
                    {t.accountAddressListTitle || "Danh sách địa chỉ"}
                  </h4>

                  {addresses.length === 0 ? (
                    <div
                      style={{
                        background: "#fafafa",
                        borderRadius: 14,
                        padding: 18,
                        color: "#6b7280",
                      }}
                    >
                      {t.accountNoAddress || "Bạn chưa có địa chỉ nào."}
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          style={{
                            border: addr.isDefault
                              ? "1px solid #fdba74"
                              : "1px solid #e5e7eb",
                            borderRadius: 16,
                            padding: 18,
                            background: "#fff",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                            <div style={{ flex: 1 }}>
                              <div
                                className="d-flex align-items-center flex-wrap gap-2 mb-2"
                                style={{
                                  color: "#111827",
                                  fontWeight: 800,
                                  fontSize: 16,
                                }}
                              >
                                <span>{addr.recipientName}</span>

                                {addr.isDefault && (
                                  <span
                                    style={{
                                      background: "#fff7ed",
                                      color: "#c2410c",
                                      fontSize: 12,
                                      padding: "4px 10px",
                                      borderRadius: 999,
                                      fontWeight: 700,
                                      border: "1px solid #fdba74",
                                    }}
                                  >
                                    {t.defaultAddress || "Mặc định"}
                                  </span>
                                )}
                              </div>

                              <div
                                style={{
                                  color: "#4b5563",
                                  marginBottom: 4,
                                }}
                              >
                                {addr.recipientPhone}
                              </div>

                              <div
                                style={{
                                  color: "#4b5563",
                                  lineHeight: 1.7,
                                }}
                              >
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
                                  type="button"
                                  onClick={() => handleSetDefault(addr.id)}
                                  style={{
                                    borderRadius: 10,
                                    border: "1px solid #ee4d2d",
                                    background: "#fff",
                                    color: "#ee4d2d",
                                    fontWeight: 700,
                                    height: 38,
                                    padding: "0 14px",
                                  }}
                                >
                                  {t.accountSetDefaultButton || "Đặt mặc định"}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => startEditAddress(addr)}
                                style={{
                                  borderRadius: 10,
                                  border: "1px solid #d1d5db",
                                  background: "#fff",
                                  color: "#374151",
                                  fontWeight: 700,
                                  height: 38,
                                  padding: "0 14px",
                                }}
                              >
                                {t.edit || "Sửa"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                style={{
                                  borderRadius: 10,
                                  border: "1px solid #fecaca",
                                  background: "#fff",
                                  color: "#dc2626",
                                  fontWeight: 700,
                                  height: 38,
                                  padding: "0 14px",
                                }}
                              >
                                {t.delete || "Xóa"}
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