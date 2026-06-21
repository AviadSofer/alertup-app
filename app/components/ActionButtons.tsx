import { useState, useCallback } from "react";
import { SettingsModal } from "./SettingsModal";

export function ActionButtons({
  showSettings = true,
}: {
  showSettings?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      {showSettings && <button onClick={handleOpenModal}>⚙️ Settings</button>}

      <SettingsModal open={isModalOpen} onClose={handleCloseModal} />
    </>
  );
}
