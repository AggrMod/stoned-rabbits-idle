using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StonedRabbits.Core;
using StonedRabbits.Systems;
using StonedRabbits.Utils;

namespace StonedRabbits.UI
{
    /// <summary>
    /// Main home screen UI controller
    /// Displays Magic Dust, production rate, and building controls
    /// </summary>
    public class HomeScreenUI : MonoBehaviour
    {
        [Header("Currency Display")]
        [SerializeField] private TextMeshProUGUI _dustText;
        [SerializeField] private TextMeshProUGUI _productionRateText;

        [Header("Building Display")]
        [SerializeField] private TextMeshProUGUI _buildingNameText;
        [SerializeField] private TextMeshProUGUI _buildingLevelText;
        [SerializeField] private TextMeshProUGUI _accumulatedDustText;

        [Header("Buttons")]
        [SerializeField] private Button _collectButton;
        [SerializeField] private TextMeshProUGUI _collectButtonText;
        [SerializeField] private Button _upgradeButton;
        [SerializeField] private TextMeshProUGUI _upgradeButtonText;

        [Header("References")]
        [SerializeField] private Building _building;

        private void Start()
        {
            // Subscribe to events
            if (CurrencyManager.Instance != null)
            {
                CurrencyManager.Instance.OnDustChanged += UpdateDustDisplay;
                UpdateDustDisplay(CurrencyManager.Instance.MagicDust);
            }

            if (_building != null)
            {
                _building.OnLevelChanged += OnBuildingLevelChanged;
                _building.OnDustProduced += OnDustProduced;
                _building.OnDustCollected += OnDustCollected;
                UpdateBuildingDisplay();
            }

            // Setup buttons
            _collectButton?.onClick.AddListener(OnCollectClicked);
            _upgradeButton?.onClick.AddListener(OnUpgradeClicked);
        }

        private void Update()
        {
            // Update accumulated dust display every frame (smooth updates)
            UpdateAccumulatedDisplay();
            UpdateUpgradeButton();
        }

        private void OnDestroy()
        {
            // Unsubscribe from events
            if (CurrencyManager.Instance != null)
            {
                CurrencyManager.Instance.OnDustChanged -= UpdateDustDisplay;
            }

            if (_building != null)
            {
                _building.OnLevelChanged -= OnBuildingLevelChanged;
                _building.OnDustProduced -= OnDustProduced;
                _building.OnDustCollected -= OnDustCollected;
            }
        }

        #region Display Updates

        private void UpdateDustDisplay(BigNumber dust)
        {
            if (_dustText != null)
            {
                _dustText.text = $"Magic Dust: {dust}";
            }
        }

        private void UpdateBuildingDisplay()
        {
            if (_building == null || _building.Data == null) return;

            if (_buildingNameText != null)
            {
                _buildingNameText.text = _building.Data.buildingName;
            }

            if (_buildingLevelText != null)
            {
                _buildingLevelText.text = $"Level: {_building.Level}";
            }

            if (_productionRateText != null)
            {
                _productionRateText.text = $"+{_building.CurrentProduction}/sec";
            }
        }

        private void UpdateAccumulatedDisplay()
        {
            if (_building == null) return;

            if (_accumulatedDustText != null)
            {
                _accumulatedDustText.text = $"Ready: {_building.AccumulatedDust}";
            }

            // Update collect button text
            if (_collectButtonText != null)
            {
                _collectButtonText.text = _building.AccumulatedDust > 0
                    ? $"Collect ({_building.AccumulatedDust})"
                    : "Collect";
            }
        }

        private void UpdateUpgradeButton()
        {
            if (_building == null) return;

            bool canAfford = _building.CanAffordUpgrade();

            if (_upgradeButton != null)
            {
                _upgradeButton.interactable = canAfford;
            }

            if (_upgradeButtonText != null)
            {
                _upgradeButtonText.text = $"Upgrade: {_building.CurrentUpgradeCost}";
            }
        }

        #endregion

        #region Event Handlers

        private void OnBuildingLevelChanged(Building building)
        {
            UpdateBuildingDisplay();
        }

        private void OnDustProduced(Building building, BigNumber amount)
        {
            // Could add visual feedback here (particles, etc.)
        }

        private void OnDustCollected(Building building, BigNumber amount)
        {
            // Could add collection animation here
        }

        #endregion

        #region Button Handlers

        private void OnCollectClicked()
        {
            _building?.CollectDust();
        }

        private void OnUpgradeClicked()
        {
            if (_building != null && _building.TryUpgrade())
            {
                // Upgrade successful - could play sound/animation
                Debug.Log($"Upgraded {_building.Data.buildingName} to level {_building.Level}");
            }
        }

        #endregion
    }
}
