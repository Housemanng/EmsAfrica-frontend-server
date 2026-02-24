import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import {
  getElections,
  getParties,
  getResultsByElectionAndPollingUnit,
  upsertResult,
} from "../features/results/resultsApi";
import {
  selectElections,
  selectParties,
  selectElectionsLoading,
  selectPartiesLoading,
  selectResultsByPollingUnit,
  selectResultsByPollingUnitLoading,
} from "../features/results/resultsSelectors";
import "./Results.css";

const DUMMY_POLLING_UNIT = {
  name: "Central School III Akpulu I",
  ward: "Ward 5 - Akpulu",
};

export default function Results() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [electionId, setElectionId] = useState("");
  const [pollingUnitId, setPollingUnitId] = useState("");
  const [partyVotes, setPartyVotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const elections = useSelector(selectElections) ?? [];
  const parties = useSelector(selectParties) ?? [];
  const electionsLoading = useSelector(selectElectionsLoading);
  const partiesLoading = useSelector(selectPartiesLoading);
  const existingResults = useSelector(
    selectResultsByPollingUnit(electionId, pollingUnitId)
  );
  const resultsLoading = useSelector(
    selectResultsByPollingUnitLoading(electionId, pollingUnitId)
  );

  useEffect(() => {
    dispatch(getElections());
    dispatch(getParties());
  }, [dispatch]);

  useEffect(() => {
    if (electionId && pollingUnitId) {
      dispatch(
        getResultsByElectionAndPollingUnit({ electionId, pollingUnitId })
      );
    }
  }, [dispatch, electionId, pollingUnitId]);

  const handleVoteChange = (partyId: string, value: string) => {
    setPartyVotes((prev) => ({ ...prev, [partyId]: value }));
    setMessage(null);
  };

  const refetchResults = () => {
    if (electionId && pollingUnitId) {
      dispatch(
        getResultsByElectionAndPollingUnit({ electionId, pollingUnitId })
      );
    }
  };

  const handleSaveOne = async (partyId: string) => {
    if (!electionId || !pollingUnitId) {
      setMessage({ type: "error", text: "Select election and polling unit first." });
      return;
    }
    const votesStr = partyVotes[partyId]?.trim();
    if (votesStr === undefined || votesStr === "") {
      setMessage({ type: "error", text: "Enter votes for this party." });
      return;
    }
    const votes = parseInt(votesStr, 10);
    if (isNaN(votes) || votes < 0) {
      setMessage({ type: "error", text: "Votes must be a non-negative number." });
      return;
    }
    setSaving(true);
    try {
      await dispatch(
        upsertResult({
          election: electionId,
          pollingUnit: pollingUnitId,
          party: partyId,
          votes,
        })
      ).unwrap();
      setMessage({ type: "success", text: "Result saved successfully." });
      setPartyVotes((prev) => ({ ...prev, [partyId]: "" }));
      refetchResults();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : "Failed to save result.";
      setMessage({ type: "error", text: String(msg) });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!electionId || !pollingUnitId) {
      setMessage({ type: "error", text: "Select election and polling unit first." });
      return;
    }
    const entries = Object.entries(partyVotes).filter(
      ([_, v]) => v !== undefined && v.trim() !== ""
    );
    if (entries.length === 0) {
      setMessage({ type: "error", text: "Enter votes for at least one party." });
      return;
    }
    let ok = 0;
    let errMsg = "";
    setSaving(true);
    for (const [partyId, votesStr] of entries) {
      const votes = parseInt(String(votesStr).trim(), 10);
      if (isNaN(votes) || votes < 0) continue;
      try {
        await dispatch(
          upsertResult({
            election: electionId,
            pollingUnit: pollingUnitId,
            party: partyId,
            votes,
          })
        ).unwrap();
        ok++;
      } catch (e: unknown) {
        errMsg =
          e && typeof e === "object" && "data" in e
            ? String((e as { data?: { message?: string } }).data?.message)
            : "Failed to save.";
        break;
      }
    }
    setSaving(false);
    if (ok > 0) {
      setMessage({
        type: "success",
        text: errMsg
          ? `Saved ${ok} result(s). Error: ${errMsg}`
          : `All ${ok} result(s) saved successfully.`,
      });
      setPartyVotes({});
      refetchResults();
    }
    if (errMsg && ok === 0) setMessage({ type: "error", text: errMsg });
  };

  const results = (existingResults?.results ?? []) as Array<{
    party?: { name?: string; acronym?: string };
    votes?: number;
  }>;

  return (
    <div className="results-page">
      <div>
        <p className="results-page__breadcrumb">EMS / Results</p>
        <h1 className="results-page__title">Enter Results</h1>
      </div>

      <div className="results-polling-unit">
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">User</span>
          <span className="results-polling-unit__value">{user?.username || "—"}</span>
        </div>
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">Polling Unit</span>
          <span className="results-polling-unit__value">{DUMMY_POLLING_UNIT.name}</span>
        </div>
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">Ward</span>
          <span className="results-polling-unit__value">{DUMMY_POLLING_UNIT.ward}</span>
        </div>
      </div>

      <div className="results-card">
        <h2 className="results-card__heading">Result entry</h2>
        <p className="results-view__empty" style={{ marginBottom: "1rem", background: "transparent", textAlign: "left" }}>
          Select an election and polling unit, then enter vote counts for each party.
        </p>
        <form
          className="results-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveAll();
          }}
        >
          <div className="results-form__row">
            <div className="results-form__field">
              <label className="results-form__label" htmlFor="election">
                Election
              </label>
              <select
                id="election"
                className="results-form__select"
                value={electionId}
                onChange={(e) => setElectionId(e.target.value)}
              >
                <option value="">Select election</option>
                {(elections as { _id: string; name: string }[]).map((el) => (
                  <option key={el._id} value={el._id}>
                    {el.name}
                  </option>
                ))}
              </select>
              {electionsLoading && (
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Loading…</span>
              )}
            </div>
            <div className="results-form__field">
              <label className="results-form__label" htmlFor="pollingUnit">
                Polling unit ID
              </label>
              <input
                id="pollingUnit"
                type="text"
                className="results-form__input"
                placeholder="e.g. 507f1f77bcf86cd799439011"
                value={pollingUnitId}
                onChange={(e) => setPollingUnitId(e.target.value.trim())}
              />
            </div>
          </div>

          {electionId && pollingUnitId && parties.length > 0 && (
            <>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Party</th>
                    <th>Votes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(parties as { _id: string; name: string; acronym: string }[]).map((party) => (
                    <tr key={party._id}>
                      <td>
                        <strong>{party.acronym || party.name}</strong>
                        {party.acronym && party.name && (
                          <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>
                            ({party.name})
                          </span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          className="results-table__votes-input"
                          placeholder="0"
                          value={partyVotes[party._id] ?? ""}
                          onChange={(e) => handleVoteChange(party._id, e.target.value)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="results-table__save-btn"
                          onClick={() => handleSaveOne(party._id)}
                          disabled={saving}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="results-actions">
                <button
                  type="submit"
                  className="results-btn results-btn--primary"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save all"}
                </button>
              </div>
            </>
          )}

          {parties.length === 0 && !partiesLoading && electionId && (
            <p className="results-view__empty" style={{ marginTop: "0.5rem" }}>
              No parties found. Add parties in the admin panel first.
            </p>
          )}

          {message && (
            <div
              className={`results-message results-message--${message.type}`}
            >
              {message.text}
            </div>
          )}
        </form>
      </div>

      {electionId && pollingUnitId && (
        <div className="results-card results-view">
          <div className="results-view__header">
            <h3 className="results-view__title">Existing results for this polling unit</h3>
            <button
              type="button"
              className="results-view__refresh"
              onClick={() => refetchResults()}
            >
              Refresh
            </button>
          </div>
          {resultsLoading ? (
            <p className="results-view__empty">Loading…</p>
          ) : results.length === 0 ? (
            <p className="results-view__empty">No results entered yet.</p>
          ) : (
            <div className="results-view__list">
              {results.map((r, i) => (
                <div key={i} className="results-view__item">
                  <span className="results-view__party">
                    {r.party?.acronym || r.party?.name || "Party"}
                  </span>
                  <span className="results-view__votes">{r.votes ?? 0} votes</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
