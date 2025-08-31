// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract InsuranceManager {
    struct InsurancePlan {
        string policyNumber;
        string provider;
        string planName;
        uint256 coverageAmount;
        uint256 startDate;
        uint256 endDate;
        bool isActive;
        uint256 premiumAmount;
        uint256 nextPremiumDate;
        address[] beneficiaries;
        bool hospitalCoverage;
        bool medicineCoverage;
        bool accidentCoverage;
        bool criticalIllnessCoverage;
    }

    // Mapping from patient address to their insurance plans
    mapping(address => InsurancePlan[]) private patientInsurancePlans;
    
    // Events
    event InsurancePlanAdded(address indexed patient, string policyNumber);
    event InsurancePlanUpdated(address indexed patient, string policyNumber);
    event InsurancePlanCancelled(address indexed patient, string policyNumber);

    // Add a new insurance plan
    function addInsurancePlan(
        string memory _policyNumber,
        string memory _provider,
        string memory _planName,
        uint256 _coverageAmount,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _premiumAmount,
        uint256 _nextPremiumDate,
        address[] memory _beneficiaries,
        bool _hospitalCoverage,
        bool _medicineCoverage,
        bool _accidentCoverage,
        bool _criticalIllnessCoverage
    ) public {
        InsurancePlan memory newPlan = InsurancePlan({
            policyNumber: _policyNumber,
            provider: _provider,
            planName: _planName,
            coverageAmount: _coverageAmount,
            startDate: _startDate,
            endDate: _endDate,
            isActive: true,
            premiumAmount: _premiumAmount,
            nextPremiumDate: _nextPremiumDate,
            beneficiaries: _beneficiaries,
            hospitalCoverage: _hospitalCoverage,
            medicineCoverage: _medicineCoverage,
            accidentCoverage: _accidentCoverage,
            criticalIllnessCoverage: _criticalIllnessCoverage
        });

        patientInsurancePlans[msg.sender].push(newPlan);
        emit InsurancePlanAdded(msg.sender, _policyNumber);
    }

    // Get all insurance plans for a patient
    function getInsurancePlans(address _patient) public view returns (InsurancePlan[] memory) {
        return patientInsurancePlans[_patient];
    }

    // Get active insurance plans for a patient
    function getActiveInsurancePlans(address _patient) public view returns (InsurancePlan[] memory) {
        InsurancePlan[] memory allPlans = patientInsurancePlans[_patient];
        uint activeCount = 0;

        // Count active plans
        for (uint i = 0; i < allPlans.length; i++) {
            if (allPlans[i].isActive && allPlans[i].endDate > block.timestamp) {
                activeCount++;
            }
        }

        // Create array of active plans
        InsurancePlan[] memory activePlans = new InsurancePlan[](activeCount);
        uint currentIndex = 0;

        for (uint i = 0; i < allPlans.length; i++) {
            if (allPlans[i].isActive && allPlans[i].endDate > block.timestamp) {
                activePlans[currentIndex] = allPlans[i];
                currentIndex++;
            }
        }

        return activePlans;
    }

    // Cancel an insurance plan
    function cancelInsurancePlan(string memory _policyNumber) public {
        InsurancePlan[] storage plans = patientInsurancePlans[msg.sender];
        
        for (uint i = 0; i < plans.length; i++) {
            if (keccak256(bytes(plans[i].policyNumber)) == keccak256(bytes(_policyNumber))) {
                plans[i].isActive = false;
                emit InsurancePlanCancelled(msg.sender, _policyNumber);
                break;
            }
        }
    }
}
