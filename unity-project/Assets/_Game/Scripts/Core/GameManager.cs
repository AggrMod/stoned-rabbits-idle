using UnityEngine;
using StonedRabbits.Systems;

namespace StonedRabbits.Core
{
    /// <summary>
    /// Main game manager - initializes systems and manages game state
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("References")]
        [SerializeField] private CurrencyManager _currencyManager;
        [SerializeField] private SaveManager _saveManager;

        [Header("Debug")]
        [SerializeField] private bool _showDebugInfo = true;

        public bool IsInitialized { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            Initialize();
        }

        private void Initialize()
        {
            Debug.Log("[GameManager] Initializing Stoned Rabbits: Idle Empire");

            // Ensure target frame rate for mobile
            Application.targetFrameRate = 60;

            // Prevent screen from sleeping during gameplay
            Screen.sleepTimeout = SleepTimeout.NeverSleep;

            IsInitialized = true;
            Debug.Log("[GameManager] Initialization complete");
        }

        private void OnGUI()
        {
            if (!_showDebugInfo) return;

            // Debug overlay
            GUILayout.BeginArea(new Rect(10, 10, 300, 100));
            GUILayout.Label($"Stoned Rabbits: Idle Empire (Debug)");
            GUILayout.Label($"FPS: {(1f / Time.deltaTime):F0}");
            if (CurrencyManager.Instance != null)
            {
                GUILayout.Label($"Magic Dust: {CurrencyManager.Instance.MagicDust}");
            }
            GUILayout.EndArea();
        }

        /// <summary>
        /// Reset game to initial state (for testing)
        /// </summary>
        [ContextMenu("Reset Game")]
        public void ResetGame()
        {
            SaveManager.Instance?.DeleteSave();
            CurrencyManager.Instance?.SetDust(0);
            Debug.Log("[GameManager] Game reset");
        }
    }
}
