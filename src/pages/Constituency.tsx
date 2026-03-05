import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import type { AppDispatch, RootState } from "../app/store";
import { getStatesByOrganizationId, selectStatesByOrganizationId } from "../features/states";
import { getLGAsByState, selectLGAsByState } from "../features/lgas";
import { getWardsByLGA, selectWardsByLGA } from "../features/wards";
import {
  getConstituenciesByOrganization,
  createConstituency,
  updateConstituency,
  deleteConstituency,
  type ConstituencyForm,
  type ConstituencyType,
} from "../features/constituencies/constituencyApi";
import ConstituencyModal from "../components/ConstituencyModal";
import "./Dashboard.css";

const buildKey = (prefix: string, arg: unknown) =>
  `${prefix}::${JSON.stringify(arg)}`;

const TYPE_LABELS: Record<string, string> = {
  governorship: "Governorship",
  senate: "Senate",
  house_of_rep: "House of Rep",
  state_house_of_assembly: "State Assembly",
  chairmanship: "Chairmanship",
  councillorship: "Councillorship",
};

const initialForm: ConstituencyForm = {
  name: "",
  type: "governorship",
  state: "",
  coverageType: "lga",
  coverageIds: [],
};

export default function Constituency() {
  const dispatch = useDispatch<AppDispatch>();
  const organizationId = useSelector(
    (s: RootState) => s.auth.user?.organization?._id ?? s.auth.user?.organization?.id
  );
  const organizationName = useSelector((s: RootState) => s.auth.user?.organization?.name);

  const [stateFilter, setStateFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConstituencyForm>(initialForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [selectedLgaForWards, setSelectedLgaForWards] = useState("");

  const listParams = useMemo(
    () => ({
      organizationId: organizationId ?? "",
      stateId: stateFilter || undefined,
      type: typeFilter || undefined,
    }),
    [organizationId, stateFilter, typeFilter]
  );

  const listKey = buildKey("constituencies/getConstituenciesByOrganization", listParams);
  const listData = useSelector((s: RootState) => s.constituencies.cache[listKey]) as
    | Array<{
        _id: string;
        name?: string;
        type?: string;
        state?: { _id?: string; name?: string; code?: string };
        coverageType?: string;
        coverageIds?: string[];
        coverageDetails?: Array<{ _id: string; name?: string; code?: string }>;
      }>
    | undefined;
  const listLoading = useSelector(
    (s: RootState) => s.constituencies.loading[listKey] ?? false
  );

  const orgStates = useSelector(selectStatesByOrganizationId(organizationId ?? ""));
  const lgas = (useSelector(selectLGAsByState(form.state)) ??
    []) as { _id: string; name?: string; code?: string }[];
  const wards = (useSelector(selectWardsByLGA(selectedLgaForWards)) ??
    []) as { _id: string; name?: string; code?: string }[];

  useEffect(() => {
    if (organizationId) {
      dispatch(getStatesByOrganizationId(organizationId));
    }
  }, [dispatch, organizationId]);

  useEffect(() => {
    if (organizationId) {
      dispatch(getConstituenciesByOrganization(listParams));
    }
  }, [dispatch, organizationId, listParams.organizationId, listParams.stateId, listParams.type]);

  useEffect(() => {
    if (form.state) dispatch(getLGAsByState(form.state));
  }, [dispatch, form.state]);

  useEffect(() => {
    if (selectedLgaForWards) dispatch(getWardsByLGA(selectedLgaForWards));
  }, [dispatch, selectedLgaForWards]);

  const constituencies = listData ?? [];
  const filtered = constituencies.filter((c) => {
    const name = (c.name ?? "").toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q);
  });

  const refetch = () => {
    if (organizationId) dispatch(getConstituenciesByOrganization(listParams));
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setFormError("");
    setSelectedLgaForWards("");
    setShowModal(true);
  };

  const handleOpenEdit = (c: (typeof constituencies)[0]) => {
    setEditingId(c._id);
    setForm({
      name: c.name ?? "",
      type: (c.type ?? "governorship") as ConstituencyType,
      state: (c.state as { _id?: string })?._id ?? "",
      coverageType: c.coverageType === "wards" ? "wards" : "lga",
      coverageIds: (c.coverageIds ?? []).map(String),
    });
    setFormError("");
    setSelectedLgaForWards("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(initialForm);
    setFormError("");
    setSelectedLgaForWards("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!form.state) {
      setFormError("State is required");
      return;
    }
    if (!form.coverageIds?.length) {
      setFormError(
        form.type === "councillorship" ? "Select at least one ward" : "Select at least one LGA"
      );
      return;
    }
    setFormLoading(true);
    try {
      if (editingId) {
        await dispatch(
          updateConstituency({ id: editingId, body: form })
        ).unwrap();
        Swal.fire({ icon: "success", title: "Updated", text: "Constituency updated." });
      } else {
        await dispatch(createConstituency(form)).unwrap();
        Swal.fire({ icon: "success", title: "Created", text: "Constituency created." });
      }
      handleCloseModal();
      refetch();
    } catch (err: unknown) {
      setFormError((err as { message?: string })?.message ?? "Failed to save");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (c: (typeof constituencies)[0]) => {
    const result = await Swal.fire({
      title: "Delete Constituency",
      html: `Delete <strong>"${c.name}"</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await dispatch(deleteConstituency(c._id)).unwrap();
      Swal.fire({ icon: "success", title: "Deleted" });
      refetch();
    } catch (err: unknown) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: (err as { message?: string })?.message ?? "Failed",
      });
    }
  };

  const handleStateChange = (_stateId: string) => {
    setSelectedLgaForWards("");
  };

  const statesList = (orgStates ?? []) as { _id: string; name?: string; code?: string }[];

  return (
    <div className="dash-page">
      <div className="dash-page__top">
        <div>
          <p className="dash-page__breadcrumb">
            EMS{organizationName ? ` / ${organizationName}` : ""} / Constituencies
          </p>
          <h1 className="dash-page__title">Constituencies</h1>
        </div>
        <div className="dash-page__actions">
          <button
            type="button"
            className="dash-page__btn dash-page__btn--solid"
            onClick={handleOpenCreate}
          >
            Create Constituency
          </button>
        </div>
      </div>

      <div className="dash-cards">
        <div className="dash-card">
          <h3 className="dash-card__title">Total</h3>
          <p className="dash-card__value">{constituencies.length}</p>
          <p className="dash-card__meta">Constituencies</p>
        </div>
        <div className="dash-card dash-card--banner">
          <div className="dash-card__banner-inner">
            <h3 className="dash-card__banner-title">Manage Constituencies</h3>
            <div className="dash-card__banner-actions">
              <button type="button" className="dash-card__cta dash-card__cta--primary" onClick={handleOpenCreate}>
                Create Constituency
              </button>
            </div>
            <p className="dash-card__banner-meta">
              Create constituencies for Governorship, Senate, House of Rep, State Assembly, Chairmanship, or Councillorship
            </p>
          </div>
        </div>
      </div>

      <section className="dash-table-section">
        <div className="dash-table-section__head">
          <h2 className="dash-table-section__title">Constituencies ({filtered.length})</h2>
          <div className="dash-table-section__tools">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: 6, marginRight: 8 }}
            >
              <option value="">All states</option>
              {statesList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name ?? s.code}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: 6, marginRight: 8 }}
            >
              <option value="">All types</option>
              {Object.entries(TYPE_LABELS).map(([v, lbl]) => (
                <option key={v} value={v}>
                  {lbl}
                </option>
              ))}
            </select>
            <div className="dash-table-section__search">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {listLoading && constituencies.length === 0 ? (
          <p className="dash-table-section__meta">Loading...</p>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>State</th>
                  <th>Coverage</th>
                  <th className="dash-table__actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="dash-table__empty">
                      No constituencies found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name ?? "—"}</td>
                      <td>
                        <span className="dash-table__status">
                          {TYPE_LABELS[c.type ?? ""] ?? c.type}
                        </span>
                      </td>
                      <td>{(c.state as { name?: string })?.name ?? "—"}</td>
                      <td>
                        {c.coverageDetails?.length
                          ? c.coverageDetails.map((d) => d.name ?? d.code ?? d._id).join(", ")
                          : "—"}
                      </td>
                      <td className="dash-table__actions-col">
                        <button
                          type="button"
                          className="dash-page__btn dash-page__btn--outline"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", marginRight: 4 }}
                          onClick={() => handleOpenEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="dash-page__btn dash-page__btn--outline"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "#dc2626" }}
                          onClick={() => handleDelete(c)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConstituencyModal
        isOpen={showModal}
        onClose={handleCloseModal}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        loading={formLoading}
        error={formError}
        editingId={editingId}
        states={statesList}
        lgas={lgas}
        wards={wards}
        onStateChange={handleStateChange}
        selectedLgaForWards={selectedLgaForWards}
        onLgaChange={setSelectedLgaForWards}
      />
    </div>
  );
}
