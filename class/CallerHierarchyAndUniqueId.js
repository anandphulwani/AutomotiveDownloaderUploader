class CallerHierarchyAndUniqueId {
    constructor(callerHierarchy, uniqueId) {
        this.callerHierarchy = callerHierarchy;
        this.uniqueId = uniqueId;
        Object.freeze(this);
    }
}

export default CallerHierarchyAndUniqueId;
