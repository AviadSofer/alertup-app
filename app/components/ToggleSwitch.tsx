import styles from "./ToggleSwitch.module.css";

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  loading,
  label,
  id,
}: {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  id?: string;
}) {
  return (
    <div 
      className={styles.toggleContainer}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      {label && (
        <span className={styles.toggleLabel}>
          {label}
        </span>
      )}
      <label className={styles.toggleSwitch}>
        <input 
          id={id}
          type="checkbox" 
          checked={checked} 
          onChange={onChange}
          disabled={disabled || loading}
        />
        <span className={styles.slider}></span>
      </label>
      {loading && <div className={styles.loadingSpinner} />}
    </div>
  );
}
