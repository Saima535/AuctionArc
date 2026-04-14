import styles from "./AccountForms.module.css";

export function ProfileEditor({
  title,
  description,
  fields,
  helper = "Frontend-only editor for now. Save behavior will be connected during backend integration.",
}) {
  return (
    <section className={styles.formCard}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <form className={styles.form}>
        <div className={styles.fieldGrid}>
          {fields.map((field) => {
            if (field.type === "select") {
              return (
                <div key={field.name} className={styles.field}>
                  <label htmlFor={field.name}>{field.label}</label>
                  <select id={field.name} name={field.name} defaultValue={field.defaultValue}>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (field.type === "textarea") {
              return (
                <div key={field.name} className={styles.field}>
                  <label htmlFor={field.name}>{field.label}</label>
                  <textarea id={field.name} name={field.name} defaultValue={field.defaultValue} />
                </div>
              );
            }

            return (
              <div key={field.name} className={styles.field}>
                <label htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  defaultValue={field.defaultValue}
                />
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.primary}>
            Save Changes
          </button>
          <button type="button" className={styles.secondary}>
            Cancel
          </button>
        </div>
        <p className={styles.helper}>{helper}</p>
      </form>
    </section>
  );
}

export function SettingsEditor({
  title,
  description,
  fields,
  helper = "Prepared for real persistence and validation in the backend phase.",
}) {
  return (
    <section className={styles.formCard}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <form className={styles.form}>
        {fields.map((field) => {
          if (field.type === "select") {
            return (
              <div key={field.name} className={styles.field}>
                <label htmlFor={field.name}>{field.label}</label>
                <select id={field.name} name={field.name} defaultValue={field.defaultValue}>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <div key={field.name} className={styles.field}>
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                name={field.name}
                type={field.type || "text"}
                defaultValue={field.defaultValue}
              />
            </div>
          );
        })}

        <div className={styles.actions}>
          <button type="button" className={styles.primary}>
            Update Settings
          </button>
        </div>
        <p className={styles.helper}>{helper}</p>
      </form>
    </section>
  );
}
