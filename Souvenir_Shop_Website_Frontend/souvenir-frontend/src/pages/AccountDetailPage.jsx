import { useCallback, useEffect, useMemo, useState } from "react";
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
// Thêm 2 hàm này trước component

const getRoleLabel = (role) => {
  const map = {
    customer: "Khách hàng",
    admin: "Quản trị viên",
  };
  return map[String(role || "").toLowerCase()] || role || "-";
};

const getStatusLabel = (status) => {
  const map = {
    active: "Đang hoạt động",
    banned: "Đã khóa",
  };
  return map[String(status || "").toLowerCase()] || status || "-";
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

  const provinceOptions = useMemo(() => {
    return vnAddressData.map((item) => item.province);
  }, []);

  const selectedProvince = useMemo(() => {
    return vnAddressData.find((item) => item.province === addressForm.province);
  }, [addressForm.province]);

  const districtOptions = useMemo(() => {
    return selectedProvince
      ? selectedProvince.districts.map((district) => district.name)
      : [];
  }, [selectedProvince]);

  const selectedDistrict = useMemo(() => {
    return selectedProvince?.districts.find(
      (district) => district.name === addressForm.district
    );
  }, [selectedProvince, addressForm.district]);

  const wardOptions = useMemo(() => {
    return selectedDistrict ? selectedDistrict.wards : [];
  }, [selectedDistrict]);

  const loadData = useCallback(async () => {
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
  }, [t.accountLoadFailed]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setAddressForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    if (name === "province") {
      setAddressForm((prev) => ({
        ...prev,
        province: value,
        district: "",
        ward: "",
      }));
      return;
    }

    if (name === "district") {
      setAddressForm((prev) => ({
        ...prev,
        district: value,
        ward: "",
      }));
      return;
    }

    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const startEditAddress = (address) => {
    setEditingAddressId(address.id);

    setAddressForm({
      recipientName: address.recipientName || "",
      recipientPhone: address.recipientPhone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      ward: address.ward || "",
      district: address.district || "",
      province: address.province || "",
      country: address.country || "VN",
      postalCode: address.postalCode || "",
      isDefault: !!address.isDefault,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditAddress = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
  };

  const handleDeleteAddress = async (id) => {
    const ok = window.confirm(
      t.accountDeleteAddressConfirm || "Bạn có chắc muốn xóa địa chỉ này?"
    );

    if (!ok) return;

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
      <section className="section account-page-section">
        <div className="container">
          <div className="account-card account-header-card">
            <div className="account-header-top">
              <div>
                <div className="account-kicker">
                  {t.accountHeaderSmall || "Tài khoản SouVN"}
                </div>

                <h2 className="account-title">
                  {t.accountHeaderTitle || "Tài khoản của tôi"}
                </h2>
              </div>

              <div className="account-address-count">
                {t.accountAddressCount || "Số địa chỉ:"}{" "}
                <span>{addresses.length}</span>
              </div>
            </div>
          </div>

          {err && (
            <div className="account-alert account-alert-error" role="alert">
              {String(err)}
            </div>
          )}

          {loading ? (
            <div className="account-card account-loading-card">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="account-loading-text">
                {t.accountLoading || "Đang tải thông tin tài khoản..."}
              </p>
            </div>
          ) : (
            <div className="row g-4 align-items-start">
              <div className="col-lg-5">
                <div className="account-card account-panel-card">
                  <h4 className="account-section-title">
                    {t.accountPersonalInfo || "Thông tin cá nhân"}
                  </h4>

                  {profileMsg && (
                    <div
                      className="account-alert account-alert-success"
                      role="alert"
                    >
                      {profileMsg}
                    </div>
                  )}

                  <div className="account-profile-summary">
                    <div>
                      <strong>{t.emailLabel || "Email:"}</strong>{" "}
                      {profile?.email || "-"}
                    </div>

                    <div>
                      <strong>{t.accountRoleLabel || "Vai trò:"}</strong>{" "}
                      {getRoleLabel(profile?.role)}
                    </div>

                    <div>
                      <strong>{t.accountStatusLabel || "Trạng thái:"}</strong>{" "}
                      {getStatusLabel(profile?.status)}
                    </div>
                  </div>

                  <form onSubmit={submitProfile}>
                    <div className="mb-3">
                      <label className="form-label account-form-label">
                        {t.fullNameLabel || "Họ và tên"}
                      </label>

                      <input
                        name="fullName"
                        className="form-control account-input"
                        value={profileForm.fullName}
                        onChange={handleProfileChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label account-form-label">
                        {t.phoneLabel || "Số điện thoại"}
                      </label>

                      <input
                        name="phone"
                        className="form-control account-input"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="account-btn account-btn-primary account-btn-profile"
                    >
                      {savingProfile
                        ? t.accountUpdating || "Đang cập nhật..."
                        : t.accountSaveProfile || "Lưu thông tin cá nhân"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="account-card account-address-form-card">
                  <div className="account-form-title-row">
                    <h4 className="account-form-title">
                      {editingAddressId
                        ? t.accountEditAddressTitle || "Chỉnh sửa địa chỉ"
                        : t.accountAddAddressTitle || "Thêm địa chỉ mới"}
                    </h4>

                    {editingAddressId && (
                      <span className="account-editing-badge">
                        {t.accountEditingBadge || "Đang chỉnh sửa"}
                      </span>
                    )}
                  </div>

                  {addressMsg && (
                    <div
                      className="account-alert account-alert-success"
                      role="alert"
                    >
                      {addressMsg}
                    </div>
                  )}

                  <form onSubmit={submitAddress}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label account-form-label">
                          {t.accountRecipientName || "Tên người nhận"}
                        </label>

                        <input
                          name="recipientName"
                          className="form-control account-input"
                          value={addressForm.recipientName}
                          onChange={handleAddressChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label account-form-label">
                          {t.accountRecipientPhone || "SĐT người nhận"}
                        </label>

                        <input
                          name="recipientPhone"
                          className="form-control account-input"
                          value={addressForm.recipientPhone}
                          onChange={handleAddressChange}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label account-form-label">
                          {t.accountAddressLine1 || "Địa chỉ dòng 1"}
                        </label>

                        <input
                          name="addressLine1"
                          className="form-control account-input"
                          value={addressForm.addressLine1}
                          onChange={handleAddressChange}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label account-form-label">
                          {t.accountAddressLine2 || "Địa chỉ dòng 2"}
                        </label>

                        <input
                          name="addressLine2"
                          className="form-control account-input"
                          value={addressForm.addressLine2}
                          onChange={handleAddressChange}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label account-form-label">
                          {t.accountProvince || "Tỉnh/Thành phố"}
                        </label>

                        <select
                          name="province"
                          className="form-select account-input"
                          value={addressForm.province}
                          onChange={handleAddressChange}
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
                        <label className="form-label account-form-label">
                          {t.accountDistrict || "Quận/Huyện"}
                        </label>

                        <select
                          name="district"
                          className="form-select account-input"
                          value={addressForm.district}
                          onChange={handleAddressChange}
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
                        <label className="form-label account-form-label">
                          {t.accountWard || "Phường/Xã"}
                        </label>

                        <select
                          name="ward"
                          className="form-select account-input"
                          value={addressForm.ward}
                          onChange={handleAddressChange}
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
                        <label className="form-label account-form-label">
                          {t.accountCountry || "Quốc gia"}
                        </label>

                        <input
                          name="country"
                          className="form-control account-input"
                          value={addressForm.country}
                          onChange={handleAddressChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label account-form-label">
                          {t.accountPostalCode || "Mã bưu chính"}
                        </label>

                        <input
                          name="postalCode"
                          className="form-control account-input"
                          value={addressForm.postalCode}
                          onChange={handleAddressChange}
                        />
                      </div>

                      <div className="col-12">
                        <div className="form-check account-default-check">
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
                          >
                            {t.accountSetDefaultCheckbox ||
                              "Đặt làm địa chỉ mặc định"}
                          </label>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="account-actions">
                          <button
                            type="submit"
                            disabled={savingAddress}
                            className="account-btn account-btn-primary"
                          >
                            {savingAddress
                              ? t.accountSaving || "Đang lưu..."
                              : editingAddressId
                              ? t.accountUpdateAddressButton ||
                                "Cập nhật địa chỉ"
                              : t.accountAddAddressButton || "Thêm địa chỉ"}
                          </button>

                          {editingAddressId && (
                            <button
                              type="button"
                              onClick={cancelEditAddress}
                              className="account-btn account-btn-secondary"
                            >
                              {t.accountCancelEdit || "Hủy chỉnh sửa"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="account-card account-panel-card">
                  <h4 className="account-section-title">
                    {t.accountAddressListTitle || "Danh sách địa chỉ"}
                  </h4>

                  {addresses.length === 0 ? (
                    <div className="account-empty-address">
                      {t.accountNoAddress || "Bạn chưa có địa chỉ nào."}
                    </div>
                  ) : (
                    <div className="account-address-list">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`account-address-item ${
                            address.isDefault ? "default" : ""
                          }`}
                        >
                          <div className="account-address-layout">
                            <div className="account-address-info">
                              <div className="account-address-name-row">
                                <span>{address.recipientName}</span>

                                {address.isDefault && (
                                  <span className="account-default-badge">
                                    {t.defaultAddress || "Mặc định"}
                                  </span>
                                )}
                              </div>

                              <div className="account-address-phone">
                                {address.recipientPhone}
                              </div>

                              <div className="account-address-full">
                                {[
                                  address.addressLine1,
                                  address.addressLine2,
                                  address.ward,
                                  address.district,
                                  address.province,
                                  address.country,
                                  address.postalCode,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            </div>

                            <div className="account-address-buttons">
                              {!address.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefault(address.id)}
                                  className="account-btn account-btn-outline-primary"
                                >
                                  {t.accountSetDefaultButton || "Đặt mặc định"}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => startEditAddress(address)}
                                className="account-btn account-btn-secondary"
                              >
                                {t.edit || "Sửa"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(address.id)}
                                className="account-btn account-btn-danger"
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