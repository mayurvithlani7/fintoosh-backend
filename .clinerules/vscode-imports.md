# 🔧 VS Code Import Management Rules

## ⚠️ CRITICAL: VS Code Auto-Import Behavior

VS Code automatically removes unused imports when you save or format files. This can cause confusion when working with AI assistants and lead to broken code.

## ✅ CORRECT WORKFLOW

### Phase 1: Plan Your Code
- **Think first**: Identify which modules/components you need
- **List dependencies**: Write down required imports before coding
- **Check usage**: Verify each import will be used in the component

### Phase 2: Write Code First
- **Implement logic**: Write the component/function logic
- **Use dependencies**: Ensure all planned imports are actually used
- **Test functionality**: Verify code works with intended imports

### Phase 3: Add Imports Explicitly
- **Manual import**: Add each import statement manually
- **Verify syntax**: Check import paths and names
- **Test immediately**: Run code to ensure imports work

### Phase 4: Final Verification
- **Save and format**: Let VS Code format the code
- **Check imports**: Ensure no imports were auto-removed
- **Run tests**: Verify functionality still works
- **Commit safely**: Only commit when all imports are verified

## ❌ PROBLEMATIC PATTERNS TO AVOID

### Pattern 1: AI Assistant Adds Imports First
```
❌ WRONG:
1. AI adds: import { useState } from 'react';
2. You write: const [count, setCount] = useState(0);
3. VS Code saves: Auto-removes unused import
4. Code breaks: useState is undefined
```

### Pattern 2: Assuming Auto-Import Works
```
❌ WRONG:
1. Write code with missing imports
2. Assume VS Code will auto-add them
3. Save file: VS Code doesn't add missing imports
4. Code breaks: Undefined references
```

### Pattern 3: Bulk Import Without Verification
```
❌ WRONG:
1. AI adds 10 imports at once
2. You only use 3 of them
3. VS Code removes 7 unused imports
4. You don't notice the removal
5. Code breaks when using removed imports
```

## 🔧 PREVENTION STRATEGIES

### 1. Explicit Import Management
- **Add one import at a time**: Verify each import individually
- **Test after each addition**: Ensure the import works
- **Use full import paths**: Avoid relative path issues

### 2. Code Organization
- **Group related imports**: Organize imports by type/library
- **Alphabetical ordering**: Easier to spot missing imports
- **Consistent naming**: Use clear, descriptive import names

### 3. Development Best Practices
- **Frequent testing**: Run code after adding imports
- **Small commits**: Commit after verifying each change
- **Code review**: Have another developer check imports

### 4. VS Code Configuration
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": false,
  "editor.codeActionsOnSave": {
    "source.organizeImports": false
  }
}
```

## 🎯 QUICK CHECKLIST

### Before Saving:
- [ ] All imports are actually used in the code
- [ ] Import paths are correct and accessible
- [ ] No duplicate imports exist
- [ ] Import names match usage in code

### After Saving:
- [ ] Run the code to verify it works
- [ ] Check that no imports were auto-removed
- [ ] Verify all functionality still works

### Before Committing:
- [ ] Test the complete feature
- [ ] Verify all imports are present and used
- [ ] Run any automated tests
- [ ] Get code review if possible

## 🚨 COMMON PITFALLS

### 1. Conditional Imports
```javascript
// ❌ Problematic
import { useState } from 'react'; // Used conditionally

if (someCondition) {
  const [count, setCount] = useState(0); // VS Code might remove import
}

// ✅ Better
const MyComponent = () => {
  const [count, setCount] = useState(0); // Always used
  // ... component logic
};
```

### 2. Type-Only Imports
```javascript
// ✅ TypeScript handles this correctly
import type { User } from './types'; // Won't be auto-removed
import { formatUser } from './utils'; // Will be checked for usage
```

### 3. Dynamic Imports
```javascript
// ✅ Dynamic imports are safe
const LazyComponent = lazy(() =>
  import('./components/HeavyComponent')
);
```

## 🛠 TROUBLESHOOTING

### Import Disappears After Save:
1. **Check usage**: Ensure the import is actually used
2. **Re-add manually**: Add the import back explicitly
3. **Test immediately**: Verify the code works with the import
4. **Disable auto-organize**: Configure VS Code to not auto-organize imports

### Code Breaks After Formatting:
1. **Check removed imports**: See what VS Code removed
2. **Restore imports**: Add back the necessary imports
3. **Adjust usage**: Ensure imports are properly used
4. **Test thoroughly**: Verify all functionality works

### AI Assistant Issues:
1. **Verify imports**: Always check AI-generated imports
2. **Add imports last**: Let AI write code first, then add imports
3. **Test each import**: Verify each import works individually
4. **Review before saving**: Check all imports before VS Code formatting

---

**Remember: VS Code's auto-import removal is a feature designed to clean up unused code, but it can break functionality when imports are added before code is written. Always write code first, then add imports, and verify everything works before committing!**
