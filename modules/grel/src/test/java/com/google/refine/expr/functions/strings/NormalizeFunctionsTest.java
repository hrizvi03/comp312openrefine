package com.google.refine.expr.functions.strings;

import org.testng.Assert;
import org.testng.annotations.Test;

import com.google.refine.expr.EvalError;
import com.google.refine.grel.GrelTestBase;

public class NormalizeFunctionsTest extends GrelTestBase {

    @Test
    public void NormalizeFunctionTestsValid() {

        Assert.assertEquals((String) (invoke("NormalizeFunction", "gödel")), "godel");
        Assert.assertEquals((String) (invoke("NormalizeFunction", "Villazón")), "Villazon");
        Assert.assertEquals((String) (invoke("NormalizeFunction", "regular")), "regular");
        Assert.assertEquals((String) (invoke("NormalizeFunction", "café")), "cafe");
        Assert.assertEquals((String) (invoke("NormalizeFunction", "Gödel and Villazón")), "Godel and Villazon");

        Assert.assertEquals((String) (invoke("NormalizeFunction", "")), "");
        Assert.assertEquals((String) (invoke("NormalizeFunction", "é")), "e");
        Assert.assertEquals((String) (invoke("NormalizeFunction", "234")), "234");
        Assert.assertEquals((String) (invoke("NormalizeFunction", "café!")), "cafe!");
    }
    
    @Test
    public void NormalizeFunctionTestsInvalid() {
        Assert.assertTrue(invoke("NormalizeFunction") instanceof EvalError);
        Assert.assertTrue(invoke("NormalizeFunction", (Object[]) null) instanceof EvalError);
        Assert.assertTrue(invoke("NormalizeFunction", "one", "two", "three") instanceof EvalError);
    }
}
