import { useState } from 'react'
import PropTypes from 'prop-types'
import { LegalModal } from '../LegalModal/LegalModal.jsx'
import styles from './AuthLegalNotice.module.css'

export const AuthLegalNotice = ({ useModal = true, className = '' }) => {
  const [modalState, setModalState] = useState({ isOpen: false, doc: 'terms' })

  const handleOpenDoc = (e, doc) => {
    if (useModal) {
      e.preventDefault()
      setModalState({ isOpen: true, doc })
    }
  }

  return (
    <>
      <p className={`${styles.notice} ${className}`.trim()}>
        Регистрируясь в ProofFlow, вы принимаете{' '}
        <a
          href="/terms"
          onClick={(e) => handleOpenDoc(e, 'terms')}
          className={styles.link}
        >
          Условия обслуживания
        </a>{' '}
        и{' '}
        <a
          href="/privacy"
          onClick={(e) => handleOpenDoc(e, 'privacy')}
          className={styles.link}
        >
          Политику конфиденциальности
        </a>
        .
      </p>

      {useModal && (
        <LegalModal
          isOpen={modalState.isOpen}
          initialDoc={modalState.doc}
          onClose={() => setModalState({ isOpen: false, doc: 'terms' })}
        />
      )}
    </>
  )
}

AuthLegalNotice.propTypes = {
  useModal: PropTypes.bool,
  className: PropTypes.string,
}
