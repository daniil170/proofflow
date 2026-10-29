import PropTypes from 'prop-types'

export const ProofFlowIcon = ({ size = 16, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <rect width="100" height="100" rx="23" fill="#0B0B0C" />
    <g transform="translate(50 50) scale(0.62) translate(-50 -50)">
      <g fill="none" strokeWidth="12" strokeLinecap="round">
        <path d="M35 84V30A14 14 0 0 1 49 16M59 84V30A14 14 0 0 1 73 16" stroke="#FFFFFF" />
        <path d="M21 44H79" stroke="#D4FF3A" />
      </g>
    </g>
  </svg>
)

ProofFlowIcon.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
}
