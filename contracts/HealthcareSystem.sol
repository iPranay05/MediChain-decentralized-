// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HealthcareSystem {
    enum Role { NONE, PATIENT, DOCTOR, HOSPITAL_ADMIN, EMERGENCY_CONTACT }
    enum AccessLevel { NONE, READ, WRITE, FULL }
    
    struct Doctor {
        string name;
        string specialization;
        bool isRegistered;
        Role role;
        uint256 registeredAt;
    }

    struct Patient {
        string aadharNumber;
        bool isRegistered;
        mapping(address => AccessLevel) authorizedProviders;
        address[] emergencyContacts;
        bool emergencyAccessActive;
        Role role;
    }

    struct AccessLog {
        address accessor;
        string patientAadhar;
        uint256 timestamp;
        string action;
        bool isEmergencyAccess;
    }

    struct Prescription {
        uint256 id;
        string patientAadhar;
        string diagnosis;
        string medicines;  // JSON string containing array of medicines
        string notes;
        uint256 timestamp;
        address hospital;
        string hospitalName;  // Added hospital name field
    }

    struct Appointment {
        uint256 id;
        string patientAadhar;
        uint256 timestamp;
        AppointmentStatus status;
        string contactEmail;
        string contactPhone;
        string notes;
        string department;
    }

    enum AppointmentStatus { SCHEDULED, COMPLETED, CANCELLED }

    struct HealthMetric {
        string metricType;
        uint256 value;
        uint256 timestamp;
        string notes;
    }

    struct MedicationTracking {
        string medication;
        uint256 startDate;
        uint256 endDate;
        string effectiveness;  // "high", "medium", "low"
        string sideEffects;
        bool active;
    }

    struct HealthAlert {
        string alertType;
        string description;
        uint256 timestamp;
        bool resolved;
    }

    // Mappings
    mapping(string => Prescription[]) private patientPrescriptions;
    Prescription[] private allPrescriptions;
    mapping(string => uint256) public healthCoins;
    mapping(address => bool) public registeredHospitals;
    mapping(address => Doctor) public doctors;
    mapping(string => Patient) private patients;
    mapping(address => Role) public roles;
    AccessLog[] private accessLogs;
    uint256 private nextAppointmentId;
    mapping(uint256 => Appointment) public appointments;
    mapping(string => uint256[]) public patientAppointments;
    mapping(address => uint256[]) public doctorAppointments;
    mapping(address => uint256[]) public hospitalAppointments;
    mapping(string => HealthMetric[]) private patientHealthMetrics;
    mapping(string => mapping(string => HealthMetric[])) private patientMetricsByType;  // aadhar -> metrics
    mapping(string => MedicationTracking[]) private medicationTracking;  // aadhar -> medications
    mapping(string => HealthAlert[]) private healthAlerts;  // aadhar -> alerts
    mapping(address => mapping(string => bool)) private doctorPatientAccess;
    mapping(address => mapping(string => bool)) private emergencyContactAccess;
    mapping(address => string) private userAadhar;

    // Events
    event AccessGranted(string indexed patientAadhar, address indexed provider, AccessLevel level);
    event AccessRevoked(string indexed patientAadhar, address indexed provider);
    event EmergencyAccessActivated(string indexed patientAadhar);
    event EmergencyAccessDeactivated(string indexed patientAadhar);
    event AccessLogAdded(string indexed patientAadhar, address indexed accessor, string action);
    event PatientRegistered(string indexed aadharNumber);
    event DoctorRegistered(address indexed doctor, string name, string specialization);
    event PrescriptionAdded(uint256 indexed prescriptionId, string indexed aadharNumber, address indexed hospital);
    event HealthCoinsAwarded(string indexed aadharNumber, uint256 amount);
    event HealthCoinsRedeemed(string indexed aadharNumber, uint256 amount);
    event AppointmentScheduled(uint256 indexed appointmentId, string patientAadhar, address doctor);
    event AppointmentStatusUpdated(uint256 indexed appointmentId, AppointmentStatus status);
    event HealthMetricAdded(string indexed aadharNumber, string metricType, uint256 value);
    event MedicationTrackingUpdated(string indexed aadharNumber, string medication, string effectiveness);
    event HealthAlertCreated(string indexed aadharNumber, string alertType);

    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Unauthorized role");
        _;
    }

    modifier onlyAuthorized(string memory _patientAadhar, AccessLevel _requiredLevel) {
        require(
            hasAccess(_patientAadhar, msg.sender, _requiredLevel) ||
            patients[_patientAadhar].emergencyAccessActive,
            "Unauthorized access"
        );
        logAccess(_patientAadhar, msg.sender, "Record Access", patients[_patientAadhar].emergencyAccessActive);
        _;
    }

    constructor() {
        roles[msg.sender] = Role.HOSPITAL_ADMIN;
        registeredHospitals[msg.sender] = true;
    }

    function registerPatient(string memory _aadharNumber) external {
        require(bytes(_aadharNumber).length == 12, "Invalid Aadhar number");
        require(!patients[_aadharNumber].isRegistered, "Patient already registered");
        
        Patient storage newPatient = patients[_aadharNumber];
        newPatient.aadharNumber = _aadharNumber;
        newPatient.isRegistered = true;
        newPatient.role = Role.PATIENT;
        
        emit PatientRegistered(_aadharNumber);
    }

    function grantAccess(
        string memory _patientAadhar,
        address _provider,
        AccessLevel _level
    ) external {
        require(
            msg.sender == address(this) || // Contract itself
            (roles[msg.sender] == Role.PATIENT && keccak256(bytes(patients[_patientAadhar].aadharNumber)) == keccak256(bytes(_patientAadhar))),
            "Unauthorized"
        );
        
        patients[_patientAadhar].authorizedProviders[_provider] = _level;
        emit AccessGranted(_patientAadhar, _provider, _level);
    }

    function revokeAccess(string memory _patientAadhar, address _provider) external {
        require(
            msg.sender == address(this) ||
            (roles[msg.sender] == Role.PATIENT && keccak256(bytes(patients[_patientAadhar].aadharNumber)) == keccak256(bytes(_patientAadhar))),
            "Unauthorized"
        );
        
        delete patients[_patientAadhar].authorizedProviders[_provider];
        emit AccessRevoked(_patientAadhar, _provider);
    }

    function addEmergencyContact(string memory _patientAadhar, address _contact) external {
        require(
            roles[msg.sender] == Role.PATIENT && 
            keccak256(bytes(patients[_patientAadhar].aadharNumber)) == keccak256(bytes(_patientAadhar)),
            "Unauthorized"
        );
        
        patients[_patientAadhar].emergencyContacts.push(_contact);
        roles[_contact] = Role.EMERGENCY_CONTACT;
    }

    function activateEmergencyAccess(string memory _patientAadhar) external {
        bool isEmergencyContact = false;
        for(uint i = 0; i < patients[_patientAadhar].emergencyContacts.length; i++) {
            if(patients[_patientAadhar].emergencyContacts[i] == msg.sender) {
                isEmergencyContact = true;
                break;
            }
        }
        require(isEmergencyContact, "Not an emergency contact");
        
        patients[_patientAadhar].emergencyAccessActive = true;
        emit EmergencyAccessActivated(_patientAadhar);
    }

    function deactivateEmergencyAccess(string memory _patientAadhar) external {
        require(
            roles[msg.sender] == Role.PATIENT && 
            keccak256(bytes(patients[_patientAadhar].aadharNumber)) == keccak256(bytes(_patientAadhar)),
            "Unauthorized"
        );
        
        patients[_patientAadhar].emergencyAccessActive = false;
        emit EmergencyAccessDeactivated(_patientAadhar);
    }

    function hasAccess(string memory _aadharNumber, address _user, AccessLevel _level) internal view returns (bool) {
        Role userRole = roles[_user];
        
        // Hospital admins have full access
        if (userRole == Role.HOSPITAL_ADMIN) return true;
        
        // Doctors have read access to all patients and write access to their patients
        if (userRole == Role.DOCTOR) {
            if (_level == AccessLevel.READ) return true;
            return doctorPatientAccess[_user][_aadharNumber];
        }
        
        // Patients have full access to their own data
        if (userRole == Role.PATIENT && keccak256(bytes(userAadhar[_user])) == keccak256(bytes(_aadharNumber))) {
            return true;
        }
        
        // Emergency contacts have read access to their assigned patients
        if (userRole == Role.EMERGENCY_CONTACT && _level == AccessLevel.READ) {
            return emergencyContactAccess[_user][_aadharNumber];
        }
        
        return false;
    }

    function logAccess(
        string memory _patientAadhar,
        address _accessor,
        string memory _action,
        bool _isEmergencyAccess
    ) internal {
        AccessLog memory log = AccessLog({
            accessor: _accessor,
            patientAadhar: _patientAadhar,
            timestamp: block.timestamp,
            action: _action,
            isEmergencyAccess: _isEmergencyAccess
        });
        
        accessLogs.push(log);
        emit AccessLogAdded(_patientAadhar, _accessor, _action);
    }

    function getAccessLogs(string memory _patientAadhar) 
        external 
        view 
        returns (AccessLog[] memory) 
    {
        require(hasAccess(_patientAadhar, msg.sender, AccessLevel.READ), "Not authorized");
        uint256 count = 0;
        for(uint256 i = 0; i < accessLogs.length; i++) {
            if(keccak256(bytes(accessLogs[i].patientAadhar)) == keccak256(bytes(_patientAadhar))) {
                count++;
            }
        }
        
        AccessLog[] memory patientLogs = new AccessLog[](count);
        uint256 index = 0;
        for(uint256 i = 0; i < accessLogs.length; i++) {
            if(keccak256(bytes(accessLogs[i].patientAadhar)) == keccak256(bytes(_patientAadhar))) {
                patientLogs[index] = accessLogs[i];
                index++;
            }
        }
        
        return patientLogs;
    }

    function registerHospital(address _hospital) external onlyRole(Role.HOSPITAL_ADMIN) {
        registeredHospitals[_hospital] = true;
    }

    function registerDoctor(
        address _doctorAddress,
        string memory _name,
        string memory _specialization
    ) external onlyRole(Role.HOSPITAL_ADMIN) {
        require(!doctors[_doctorAddress].isRegistered, "Doctor already registered");
        doctors[_doctorAddress] = Doctor(_name, _specialization, true, Role.DOCTOR, block.timestamp);
        registeredHospitals[_doctorAddress] = true;
        emit DoctorRegistered(_doctorAddress, _name, _specialization);
    }

    function addPrescription(
        string memory _patientAadhar,
        string memory _diagnosis,
        string memory _medicines,  // JSON string containing array of medicines
        string memory _notes,
        string memory _hospitalName  // Added hospital name parameter
    ) external onlyAuthorized(_patientAadhar, AccessLevel.WRITE) {
        require(bytes(_patientAadhar).length > 0, "Invalid patient Aadhar");
        require(bytes(_diagnosis).length > 0, "Invalid diagnosis");
        require(bytes(_medicines).length > 0, "Invalid medicines data");

        uint256 prescriptionId = allPrescriptions.length + 1;
        
        Prescription memory newPrescription = Prescription({
            id: prescriptionId,
            patientAadhar: _patientAadhar,
            diagnosis: _diagnosis,
            medicines: _medicines,
            notes: _notes,
            timestamp: block.timestamp,
            hospital: msg.sender,
            hospitalName: _hospitalName  // Added hospital name
        });
        
        patientPrescriptions[_patientAadhar].push(newPrescription);
        allPrescriptions.push(newPrescription);
        
        // Award health coins
        healthCoins[_patientAadhar] += 10;
        
        emit PrescriptionAdded(prescriptionId, _patientAadhar, msg.sender);
    }

    function getAllPrescriptions() external view returns (Prescription[] memory) {
        return allPrescriptions;
    }

    function getPrescriptions(string memory _patientAadhar) external view returns (Prescription[] memory) {
        return patientPrescriptions[_patientAadhar];
    }

    function scheduleAppointment(
        string memory _patientAadhar,
        uint256 _timestamp,
        string memory _contactEmail,
        string memory _contactPhone,
        string memory _notes,
        string memory _department
    ) external onlyAuthorized(_patientAadhar, AccessLevel.WRITE) {
        require(_timestamp > block.timestamp, "Invalid appointment time");

        uint256 appointmentId = nextAppointmentId++;
        
        appointments[appointmentId] = Appointment({
            id: appointmentId,
            patientAadhar: _patientAadhar,
            timestamp: _timestamp,
            status: AppointmentStatus.SCHEDULED,
            contactEmail: _contactEmail,
            contactPhone: _contactPhone,
            notes: _notes,
            department: _department
        });

        patientAppointments[_patientAadhar].push(appointmentId);
        hospitalAppointments[msg.sender].push(appointmentId);

        healthCoins[_patientAadhar] += 50;

        logAccess(_patientAadhar, msg.sender, "Schedule Appointment", false);
        emit AppointmentScheduled(appointmentId, _patientAadhar, address(0));
    }

    function updateAppointmentStatus(
        uint256 _appointmentId,
        AppointmentStatus _status
    ) external {
        require(_appointmentId < nextAppointmentId, "Invalid appointment ID");
        Appointment storage appointment = appointments[_appointmentId];
        require(bytes(appointment.patientAadhar).length > 0, "Appointment does not exist");
        require(roles[msg.sender] == Role.DOCTOR || roles[msg.sender] == Role.HOSPITAL_ADMIN, 
            "Only doctors or hospital admins can update appointment status");
        
        appointment.status = _status;
        emit AppointmentStatusUpdated(_appointmentId, _status);

        if (_status == AppointmentStatus.COMPLETED) {
            healthCoins[appointment.patientAadhar] += 100;
        }

        logAccess(appointment.patientAadhar, msg.sender, "Update Appointment Status", false);
    }

    function getPatientAppointments(string memory _patientAadhar) 
        external 
        view 
        returns (Appointment[] memory) 
    {
        require(hasAccess(_patientAadhar, msg.sender, AccessLevel.READ), "Not authorized");
        uint256[] storage appointmentIds = patientAppointments[_patientAadhar];
        Appointment[] memory result = new Appointment[](appointmentIds.length);
        
        for (uint256 i = 0; i < appointmentIds.length; i++) {
            result[i] = appointments[appointmentIds[i]];
        }
        
        return result;
    }

    function getDoctorAppointments(address _doctor) 
        external 
        view 
        returns (Appointment[] memory) 
    {
        require(hasAccess("", msg.sender, AccessLevel.READ), "Not authorized");
        uint256[] storage appointmentIds = doctorAppointments[_doctor];
        Appointment[] memory result = new Appointment[](appointmentIds.length);
        
        for (uint256 i = 0; i < appointmentIds.length; i++) {
            result[i] = appointments[appointmentIds[i]];
        }
        
        return result;
    }

    function getHospitalAppointments(address _hospital) 
        external 
        view 
        returns (Appointment[] memory) 
    {
        uint256[] storage appointmentIds = hospitalAppointments[_hospital];
        Appointment[] memory result = new Appointment[](appointmentIds.length);
        
        for (uint256 i = 0; i < appointmentIds.length; i++) {
            result[i] = appointments[appointmentIds[i]];
        }
        
        return result;
    }

    function getHealthCoins(string memory _aadharNumber) 
        external 
        view 
        returns (uint256) 
    {
        require(hasAccess(_aadharNumber, msg.sender, AccessLevel.READ), "Not authorized");
        return healthCoins[_aadharNumber];
    }

    function redeemHealthCoins(string memory _aadharNumber, uint256 _amount) 
        external 
        onlyAuthorized(_aadharNumber, AccessLevel.WRITE) 
    {
        require(healthCoins[_aadharNumber] >= _amount, "Insufficient health coins");
        healthCoins[_aadharNumber] -= _amount;
        emit HealthCoinsRedeemed(_aadharNumber, _amount);
    }

    function addHealthMetric(
        string memory _patientAadhar,
        string memory _metricType,
        uint256 _value,
        string memory _notes
    ) external onlyAuthorized(_patientAadhar, AccessLevel.WRITE) {
        require(bytes(_patientAadhar).length > 0, "Invalid Aadhar number");
        require(bytes(_metricType).length > 0, "Invalid metric type");

        HealthMetric memory newMetric = HealthMetric({
            metricType: _metricType,
            value: _value,
            timestamp: block.timestamp,
            notes: _notes
        });

        patientHealthMetrics[_patientAadhar].push(newMetric);
        patientMetricsByType[_patientAadhar][_metricType].push(newMetric);

        // Award health coins for tracking health metrics
        healthCoins[_patientAadhar] += 10;

        emit HealthMetricAdded(_patientAadhar, _metricType, _value);
    }

    function getHealthMetrics(string memory _patientAadhar) 
        external 
        view 
        returns (HealthMetric[] memory) 
    {
        require(hasAccess(_patientAadhar, msg.sender, AccessLevel.READ), "Not authorized");
        return patientHealthMetrics[_patientAadhar];
    }

    function getHealthMetrics(string memory _patientAadhar, string memory _metricType) 
        external 
        view 
        returns (HealthMetric[] memory) 
    {
        require(hasAccess(_patientAadhar, msg.sender, AccessLevel.READ), "Not authorized");
        return patientMetricsByType[_patientAadhar][_metricType];
    }

    function updateMedicationTracking(
        string memory _patientAadhar,
        string memory _medication,
        string memory _effectiveness,
        string memory _sideEffects
    ) external onlyAuthorized(_patientAadhar, AccessLevel.WRITE) {
        require(roles[msg.sender] == Role.DOCTOR || roles[msg.sender] == Role.HOSPITAL_ADMIN, "Unauthorized");
        
        bool found = false;
        MedicationTracking[] storage trackings = medicationTracking[_patientAadhar];
        
        for(uint i = 0; i < trackings.length; i++) {
            if(keccak256(bytes(trackings[i].medication)) == keccak256(bytes(_medication)) && trackings[i].active) {
                trackings[i].effectiveness = _effectiveness;
                trackings[i].sideEffects = _sideEffects;
                found = true;
                break;
            }
        }
        
        if(!found) {
            trackings.push(MedicationTracking({
                medication: _medication,
                startDate: block.timestamp,
                endDate: 0,
                effectiveness: _effectiveness,
                sideEffects: _sideEffects,
                active: true
            }));
        }
        
        emit MedicationTrackingUpdated(_patientAadhar, _medication, _effectiveness);
    }

    function stopMedication(
        string memory _patientAadhar,
        string memory _medication
    ) external onlyAuthorized(_patientAadhar, AccessLevel.WRITE) {
        require(roles[msg.sender] == Role.DOCTOR || roles[msg.sender] == Role.HOSPITAL_ADMIN, "Unauthorized");
        
        MedicationTracking[] storage trackings = medicationTracking[_patientAadhar];
        
        for(uint i = 0; i < trackings.length; i++) {
            if(keccak256(bytes(trackings[i].medication)) == keccak256(bytes(_medication)) && trackings[i].active) {
                trackings[i].active = false;
                trackings[i].endDate = block.timestamp;
                break;
            }
        }
    }

    function checkHealthAlerts(
        string memory _patientAadhar,
        string memory _metricType,
        uint256 _value
    ) internal {
        // Example thresholds - these should be customizable in production
        if(keccak256(bytes(_metricType)) == keccak256(bytes("blood_pressure_systolic"))) {
            if(_value > 140) {
                createHealthAlert(_patientAadhar, "HIGH_BLOOD_PRESSURE", "Blood pressure is above normal range");
            }
        } else if(keccak256(bytes(_metricType)) == keccak256(bytes("blood_sugar"))) {
            if(_value > 200) {
                createHealthAlert(_patientAadhar, "HIGH_BLOOD_SUGAR", "Blood sugar is above normal range");
            }
        }
    }

    function createHealthAlert(
        string memory _patientAadhar,
        string memory _alertType,
        string memory _description
    ) internal {
        HealthAlert memory alert = HealthAlert({
            alertType: _alertType,
            description: _description,
            timestamp: block.timestamp,
            resolved: false
        });
        
        healthAlerts[_patientAadhar].push(alert);
        emit HealthAlertCreated(_patientAadhar, _alertType);
    }

    function getMedicationTracking(
        string memory _patientAadhar
    ) external view returns (MedicationTracking[] memory) {
        require(hasAccess(_patientAadhar, msg.sender, AccessLevel.READ), "Not authorized");
        return medicationTracking[_patientAadhar];
    }

    function getHealthAlerts(
        string memory _patientAadhar
    ) external view returns (HealthAlert[] memory) {
        require(hasAccess(_patientAadhar, msg.sender, AccessLevel.READ), "Not authorized");
        return healthAlerts[_patientAadhar];
    }

    function resolveHealthAlert(
        string memory _patientAadhar,
        uint256 _alertIndex
    ) external onlyAuthorized(_patientAadhar, AccessLevel.WRITE) {
        require(_alertIndex < healthAlerts[_patientAadhar].length, "Invalid alert index");
        healthAlerts[_patientAadhar][_alertIndex].resolved = true;
    }
}
